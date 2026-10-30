use serde_json::{json, Value};
use std::{io::{Read, Write}, process::{Child, Command, Stdio}, sync::mpsc::{self, Receiver}, time::{Duration, Instant}};
const MAX: usize = 1_048_576;
pub struct Bridge { child: Child, input: Option<std::process::ChildStdin>, replies: Receiver<Result<Value,String>>, sequence: u64 }
pub fn read_frame(reader: &mut impl Read) -> Result<Value,String> {
    let mut header=[0;4]; reader.read_exact(&mut header).map_err(|_| "Backend EOF or truncated header".to_string())?;
    let size=u32::from_be_bytes(header) as usize;
        if size==0 || size>MAX {return Err("Invalid backend frame length (limit 1 MiB)".into())}
    let mut body=vec![0;size];reader.read_exact(&mut body).map_err(|_|"Truncated backend frame".to_string())?;
    let text=std::str::from_utf8(&body).map_err(|_|"Invalid backend UTF-8".to_string())?;
    serde_json::from_str(text).map_err(|_|"Invalid backend JSON".into())
}
impl Bridge {
    pub fn spawn() -> Result<Self,String> {
        // Development proof only: installed Gradle distribution, not an externalBin executable.
        let root=std::path::Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
        let launcher=root.join("backend/build/install/backend/bin/backend.bat");
        if !launcher.is_file(){return Err("Backend installDist launcher missing".into())}
        let java=std::env::var("V2_JAVA_HOME").map_err(|_|"Set V2_JAVA_HOME to an installed Java 21 runtime (machine JAVA_HOME may be Java 11)".to_string())?;
        if !std::path::Path::new(&java).join("bin/java.exe").is_file(){return Err("V2_JAVA_HOME has no bin/java.exe".into())}
        let temp=root.join("src-tauri/.tmp");std::fs::create_dir_all(&temp).map_err(|e|e.to_string())?;
        let mut command=Command::new("cmd.exe");
        command.args(["/d","/c", "backend.bat", "--simulator"]);
        command.current_dir(launcher.parent().unwrap()).env("JAVA_HOME",java).env("TEMP",&temp).env("TMP",&temp)
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
    pub fn check(&mut self)->Result<Value,String>{
        if self.child.try_wait().map_err(|e|e.to_string())?.is_some(){return Err("Backend launcher exited".into())}
        self.sequence+=1;let id=format!("shell-{}",self.sequence);
        let request=serde_json::to_vec(&json!({"jsonrpc":"2.0","id":id,"method":"health.check","params":{},"protocolVersion":1})).unwrap();
        let input=self.input.as_mut().ok_or("Backend stdin closed")?;
        input.write_all(&(request.len() as u32).to_be_bytes()).and_then(|_|input.write_all(&request)).and_then(|_|input.flush()).map_err(|_|"Backend stdin write failed".to_string())?;
        let reply=self.replies.recv_timeout(Duration::from_secs(10)).map_err(|_|"Backend timeout or reader disconnected".to_string())??;
        if reply["id"]!=id || reply["jsonrpc"]!="2.0" || reply["protocolVersion"]!=1 {return Err("Backend response correlation/protocol mismatch".into())}
        let result=&reply["result"];
        if reply.get("error").is_some() || result["status"]!="ok" || result["protocolVersion"]!=1 || result["simulator"]!=true || result["availableMethods"]!=json!(["health.check"]) || result["backendPid"].as_u64().filter(|p|*p>0).is_none() || result["uptimeMs"].as_u64().is_none() || result["jvmVersion"].as_str().is_none(){return Err("Backend health response failed validation".into())}
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
    #[test] fn framing_bounds_and_eof(){for bytes in [vec![],vec![0,0,0],vec![0,16,0,1],vec![255;4],vec![0;4],vec![0,0,0,2,b'{']]{assert!(read_frame(&mut &bytes[..]).is_err())}}
    #[test] fn valid_frame(){let body=br#"{"id":"test"}"#;let mut bytes=(body.len() as u32).to_be_bytes().to_vec();bytes.extend(body);assert_eq!(read_frame(&mut &bytes[..]).unwrap()["id"],"test")}
    #[test] fn fragmented_reads(){struct One(std::io::Cursor<Vec<u8>>);impl Read for One{fn read(&mut self,b:&mut[u8])->std::io::Result<usize>{let n=b.len().min(1);self.0.read(&mut b[..n])}}let body=br#"{"ok":true}"#;let mut bytes=(body.len() as u32).to_be_bytes().to_vec();bytes.extend(body);assert_eq!(read_frame(&mut One(std::io::Cursor::new(bytes))).unwrap()["ok"],true)}
}
