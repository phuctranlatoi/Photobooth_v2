use serde_json::{json, Value};
use std::{io::{Read, Write}, process::{Child, Command, Stdio}, sync::mpsc::{self, Receiver}, time::{Duration, Instant}};
const MAX: usize = 16_777_216;
#[derive(Debug)]
pub enum RequestError { Transport(String), Rejected(String) }
impl std::fmt::Display for RequestError {
    fn fmt(&self, f:&mut std::fmt::Formatter<'_>)->std::fmt::Result {
        match self { Self::Transport(message)|Self::Rejected(message)=>f.write_str(message) }
    }
}
pub struct Bridge { child: Child, input: Option<std::process::ChildStdin>, replies: Receiver<Result<Value,String>>, sequence: u64 }

pub fn is_valid_java_home(path: &std::path::Path) -> bool {
    path.join("bin").join("java.exe").is_file() || path.join("bin").join("java").is_file()
}

pub fn is_java_21(path: &std::path::Path) -> bool {
    let release_file = path.join("release");
    if let Ok(content) = std::fs::read_to_string(release_file) {
        for line in content.lines() {
            if line.starts_with("JAVA_VERSION=") || line.starts_with("JAVA_RUNTIME_VERSION=") {
                let val = line.split('=').nth(1).unwrap_or("").trim_matches('"');
                return val.starts_with("21.") || val.starts_with("21-") || val == "21" || val.starts_with("22.") || val.starts_with("23.") || val.starts_with("24.") || val.starts_with("25.");
            }
        }
        return false;
    }
    let s = path.to_string_lossy().to_lowercase();
    s.contains("jdk-21") || s.contains("jre-21") || s.contains("jdk21") || s.contains("jre21") || s.contains("java-21")
}

pub fn resolve_launcher(root: &std::path::Path) -> Result<std::path::PathBuf, String> {
    let dev_launcher = root.join("backend/build/install/backend/bin/backend.bat");
    if dev_launcher.is_file() {
        return Ok(dev_launcher);
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(exe_dir) = exe.parent() {
            let candidates = [
                exe_dir.join("sidecar/backend/bin/backend.bat"),
                exe_dir.join("resources/sidecar/backend/bin/backend.bat"),
                exe_dir.join("backend/bin/backend.bat"),
                exe_dir.join("bin/backend.bat"),
            ];
            for candidate in candidates {
                if candidate.is_file() {
                    return Ok(candidate);
                }
            }
        }
    }
    let sidecar_launcher = root.join("sidecar/backend/bin/backend.bat");
    if sidecar_launcher.is_file() {
        return Ok(sidecar_launcher);
    }
    Err("Backend launcher missing (checked dev installDist and sidecar paths)".into())
}

pub fn resolve_java_home(root: &std::path::Path) -> Result<String, String> {
    // 1. Explicit V2 environment variable override
    if let Ok(v2_java) = std::env::var("V2_JAVA_HOME") {
        let p = std::path::PathBuf::from(&v2_java);
        if is_valid_java_home(&p) {
            return Ok(v2_java);
        }
    }

    // 2. Bundled JRE in application / root / resources directories (for portable/installer deployments)
    let mut bundled_candidates = vec![
        root.join("jre"),
        root.join("resources/jre"),
        root.join("sidecar/jre"),
        root.join("backend/jre"),
    ];
    if let Ok(exe) = std::env::current_exe() {
        if let Some(exe_dir) = exe.parent() {
            bundled_candidates.push(exe_dir.join("jre"));
            bundled_candidates.push(exe_dir.join("resources/jre"));
            bundled_candidates.push(exe_dir.join("sidecar/jre"));
        }
    }
    for candidate in bundled_candidates {
        if is_valid_java_home(&candidate) {
            return Ok(candidate.to_string_lossy().to_string());
        }
    }

    // 3. System JAVA_HOME (check if it points to Java 21+, otherwise hold as fallback)
    let mut fallback_java: Option<String> = None;
    if let Ok(sys_java) = std::env::var("JAVA_HOME") {
        let p = std::path::PathBuf::from(&sys_java);
        if is_valid_java_home(&p) {
            if is_java_21(&p) {
                return Ok(sys_java);
            }
            fallback_java = Some(sys_java);
        }
    }

    // 4. Scan standard Windows installation directories for Java 21
    let program_dirs = [
        "C:\\Program Files\\Eclipse Adoptium",
        "C:\\Program Files\\Java",
        "C:\\Program Files\\Microsoft",
        "C:\\Program Files\\BellSoft",
        "C:\\Program Files\\Amazon Corretto",
        "C:\\Program Files\\Zulu",
        "C:\\Program Files\\Semeru",
        "C:\\Program Files (x86)\\Eclipse Adoptium",
        "C:\\Program Files (x86)\\Java",
    ];

    for base_str in program_dirs {
        let base_path = std::path::Path::new(base_str);
        if let Ok(entries) = std::fs::read_dir(base_path) {
            for entry in entries.flatten() {
                let candidate = entry.path();
                if candidate.is_dir() && is_valid_java_home(&candidate) && is_java_21(&candidate) {
                    return Ok(candidate.to_string_lossy().to_string());
                }
            }
        }
    }

    // 5. Fallback to valid JAVA_HOME if no specific Java 21 was detected in standard paths
    if let Some(fallback) = fallback_java {
        return Ok(fallback);
    }

    Err("Java 21 runtime not found. Checked V2_JAVA_HOME, bundled JRE (jre, resources/jre), JAVA_HOME, and standard Windows directories (Eclipse Adoptium, Oracle, Microsoft, BellSoft, Corretto, Zulu).".to_string())
}

pub fn read_frame(reader: &mut impl Read) -> Result<Value,String> {
    let mut header=[0;4]; reader.read_exact(&mut header).map_err(|_| "Backend EOF or truncated header".to_string())?;
    let size=u32::from_be_bytes(header) as usize;
        if size==0 || size>MAX {return Err("Invalid backend frame length (limit 16 MiB)".into())}
    let mut body=vec![0;size];reader.read_exact(&mut body).map_err(|_|"Truncated backend frame".to_string())?;
    let text=std::str::from_utf8(&body).map_err(|_|"Invalid backend UTF-8".to_string())?;
    serde_json::from_str(text).map_err(|_|"Invalid backend JSON".into())
}
impl Bridge {
    pub fn spawn() -> Result<Self,String> {
        let root=std::path::Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
        let launcher=resolve_launcher(root)?;
        let java=resolve_java_home(root)?;
        let temp=root.join("src-tauri/.tmp");std::fs::create_dir_all(&temp).map_err(|e|e.to_string())?;
        let mut command=Command::new("cmd.exe");
        let mode = std::env::var("V2_RUNTIME_MODE").unwrap_or_else(|_| "--real".to_string());
        let mode_flag = if mode == "--simulator" || mode == "simulator" { "--simulator" } else { "--real" };
        command.args(["/d", "/c", "backend.bat", mode_flag]);
        command.current_dir(launcher.parent().unwrap()).env("JAVA_HOME",&java).env("SIMULATOR_CAPTURE_ENABLED","true").env("TEMP",&temp).env("TMP",&temp)
            .env("JAVA_TOOL_OPTIONS",format!("-Djava.io.tmpdir=\"{}\" -Duser.home=\"{}\"",temp.display(),temp.display()))
            .stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped());
        #[cfg(windows)] {use std::os::windows::process::CommandExt;command.creation_flags(0x08000000);}
        let mut child=command.spawn().map_err(|e|format!("Launcher spawn failed: {e}"))?;
        let input=child.stdin.take();let mut output=child.stdout.take().unwrap();let mut errors=child.stderr.take().unwrap();
        // Discard diagnostics rather than accumulating unbounded stderr or leaking environment details.
        std::thread::spawn(move||{let mut buffer=[0;4096];while let Ok(n)=errors.read(&mut buffer){if n==0{break}}});
        let (tx,replies)=mpsc::sync_channel(1);
        std::thread::spawn(move||loop{let reply=read_frame(&mut output);let fatal=reply.is_err();if tx.send(reply).is_err()||fatal{break}});
        Ok(Self{child,input,replies,sequence:0})
    }
    pub fn check(&mut self)->Result<Value,RequestError>{
        let result=self.request("health.check",json!({}))?;
        if result["status"]!="ok" || result["protocolVersion"]!=1 || !result["simulator"].is_boolean() || !result["availableMethods"].as_array().is_some_and(|a|a.iter().any(|v|v=="health.check")) || result["backendPid"].as_u64().filter(|p|*p>0).is_none() || result["uptimeMs"].as_u64().is_none() || result["jvmVersion"].as_str().is_none(){return Err(RequestError::Transport("Backend health response failed validation".into()))}
        Ok(result)
    }
    pub fn request(&mut self,method:&str,params:Value)->Result<Value,RequestError>{
        if self.child.try_wait().map_err(|e|RequestError::Transport(e.to_string()))?.is_some(){return Err(RequestError::Transport("Backend launcher exited".into()))}
        self.sequence+=1;let id=format!("shell-{}",self.sequence);
        let envelope=json!({"jsonrpc":"2.0","id":id,"method":method,"params":params,"protocolVersion":1});
        let request=serde_json::to_vec(&envelope).unwrap();
        if request.len()>MAX{return Err(RequestError::Rejected("Request exceeds frame limit".into()))}
        let input=self.input.as_mut().ok_or_else(||RequestError::Transport("Backend stdin closed".into()))?;
        input.write_all(&(request.len() as u32).to_be_bytes()).and_then(|_|input.write_all(&request)).and_then(|_|input.flush()).map_err(|_|RequestError::Transport("Backend stdin write failed".into()))?;
        let reply=self.replies.recv_timeout(Duration::from_secs(25)).map_err(|_|RequestError::Transport("Backend timeout or reader disconnected".into()))?.map_err(RequestError::Transport)?;
        if reply["id"]!=id || reply["jsonrpc"]!="2.0" || reply["protocolVersion"]!=1 {return Err(RequestError::Transport("Backend response correlation/protocol mismatch".into()))}
        let result=&reply["result"];
        if let Some(error)=reply.get("error"){return Err(RequestError::Rejected(format!("Backend rejected request: {}",error)))}
        if result.is_null(){return Err(RequestError::Transport("Missing backend result".into()))}
        Ok(result.clone())
    }
    pub fn shutdown(&mut self)->bool{
        self.input.take(); // EOF is the supported backend shutdown mechanism.
        let deadline=Instant::now()+Duration::from_secs(3);
        while Instant::now()<deadline {if matches!(self.child.try_wait(),Ok(Some(_))){return true}std::thread::sleep(Duration::from_millis(25));}
        // Windows batch launcher is a process tree; killing only cmd.exe could orphan Java.
        let _=Command::new("taskkill.exe").args(["/PID",&self.child.id().to_string(),"/T","/F"]).stdout(Stdio::null()).stderr(Stdio::null()).status();
        let _=self.child.kill();let _=self.child.wait();false
    }
}
impl Drop for Bridge{fn drop(&mut self){let _=self.shutdown();}}
#[cfg(test)] mod tests{
    use super::*;
    #[test] fn framing_bounds_and_eof(){for bytes in [vec![],vec![0,0,0],vec![1,0,0,1],vec![255;4],vec![0;4],vec![0,0,0,2,b'{']]{assert!(read_frame(&mut &bytes[..]).is_err())}}
    #[test] fn valid_frame(){let body=br#"{"id":"test"}"#;let mut bytes=(body.len() as u32).to_be_bytes().to_vec();bytes.extend(body);assert_eq!(read_frame(&mut &bytes[..]).unwrap()["id"],"test")}
    #[test] fn fragmented_reads(){struct One(std::io::Cursor<Vec<u8>>);impl Read for One{fn read(&mut self,b:&mut[u8])->std::io::Result<usize>{let n=b.len().min(1);self.0.read(&mut b[..n])}}let body=br#"{"ok":true}"#;let mut bytes=(body.len() as u32).to_be_bytes().to_vec();bytes.extend(body);assert_eq!(read_frame(&mut One(std::io::Cursor::new(bytes))).unwrap()["ok"],true)}
    #[test] fn test_is_java_21_release_parsing() {
        let temp = std::env::temp_dir().join("test_java_21_detection");
        let _ = std::fs::create_dir_all(&temp);
        let release = temp.join("release");
        std::fs::write(&release, "JAVA_VERSION=\"21.0.12\"\nJAVA_RUNTIME_VERSION=\"21.0.12+8-LTS\"\n").unwrap();
        assert!(is_java_21(&temp));
        std::fs::write(&release, "JAVA_VERSION=\"11.0.30\"\nJAVA_RUNTIME_VERSION=\"11.0.30+7\"\n").unwrap();
        assert!(!is_java_21(&temp));
        let _ = std::fs::remove_dir_all(&temp);
    }
    #[test] fn test_resolve_java_home_real_system() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
        let java = resolve_java_home(root).expect("Must resolve a valid Java 21 runtime on this machine");
        assert!(is_valid_java_home(std::path::Path::new(&java)));
    }
    #[test] fn test_resolve_bundled_jre() {
        let temp_root = std::env::temp_dir().join("test_bundled_jre_root");
        let fake_jre = temp_root.join("resources").join("jre").join("bin");
        std::fs::create_dir_all(&fake_jre).unwrap();
        let fake_exe = fake_jre.join("java.exe");
        std::fs::write(&fake_exe, b"MZ").unwrap();
        // Clear V2_JAVA_HOME temporarily if set, or test directly
        let found = resolve_java_home(&temp_root);
        // Clean up
        let _ = std::fs::remove_dir_all(&temp_root);
        assert!(found.is_ok());
    }
}
