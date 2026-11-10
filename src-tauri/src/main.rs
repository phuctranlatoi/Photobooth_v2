#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use le_souvenir_v2::bridge;
use std::sync::{Arc,Mutex};
type Shared=Arc<Mutex<Option<bridge::Bridge>>>;
#[tauri::command]
async fn health_check(state:tauri::State<'_,Shared>)->Result<serde_json::Value,String>{
    let shared=state.inner().clone();
    tauri::async_runtime::spawn_blocking(move||{
        let mut guard=shared.lock().map_err(|_|"Bridge lock unavailable")?;
        if guard.is_none(){*guard=Some(bridge::Bridge::spawn()?)}
        let result=guard.as_mut().unwrap().check();
        if matches!(result,Err(bridge::RequestError::Transport(_))){guard.take();} // Never replay an uncertain request.
        result.map_err(|error|error.to_string())
    }).await.map_err(|_|"Bridge worker failed".to_string())?
}
fn main(){
    let shared:Shared=Arc::new(Mutex::new(None));let closing=shared.clone();

    // Eagerly pre-warm JVM backend in the background while WebView and React initialize
    // so cold start latency (1-2s JVM spin-up) is completely masked before the start screen calls IPC.
    let eager=shared.clone();
    tauri::async_runtime::spawn_blocking(move||{
        if let Ok(mut guard)=eager.lock(){
            if guard.is_none(){
                if let Err(e) = bridge::Bridge::spawn().map(|b| *guard = Some(b)) { eprintln!("[v2] eager backend spawn failed: {e}"); }
            }
        }
    });

    let app=tauri::Builder::default().manage(shared).invoke_handler(tauri::generate_handler![health_check,simulator_request])
        .build(tauri::generate_context!()).expect("V2 host initialization failed");
    app.run(move|_,event|{if matches!(event,tauri::RunEvent::Exit){if let Ok(mut guard)=closing.lock(){guard.take();}}});
}
#[tauri::command]
async fn simulator_request(state:tauri::State<'_,Shared>,method:String,params:serde_json::Value)->Result<serde_json::Value,String>{
    if !matches!(method.as_str(),"operator.getSettings"|"operator.updateSettings"|"operator.getStatus"|"operator.updateLayout"|"operator.reloadFrames"|"operator.addFrame"|"operator.getFilters"|"operator.saveFilter"|"operator.importLut"|"operator.deleteFilter"|"operator.getRevenue"|"catalog.get"|"device.getStatus"|"session.start"|"session.confirmSetup"|"session.getState"|"session.cancel"|"session.finish"|"session.setLayout"|"session.setQuantity"|"session.back"|"payment.mockComplete"|"payment.createLink"|"payment.checkStatus"|"capture.startSequence"|"selection.toggle"|"selection.confirm"|"frame.list"|"frame.select"|"frame.confirm"|"print.confirmDryRun"|"print.confirmReal"){return Err("Method not permitted by simulator host".into())}
    if !params.is_object(){return Err("Simulator params must be an object".into())}
    let shared=state.inner().clone();
    tauri::async_runtime::spawn_blocking(move||{
        let mut guard=shared.lock().map_err(|_|"Bridge lock unavailable")?;
        if guard.is_none(){*guard=Some(bridge::Bridge::spawn()?)}
        // A domain rejection does not destroy an active session. Transport failures
        // are surfaced without replay; explicit reconnect is health-only.
        let result=guard.as_mut().unwrap().request(&method,params);
        if matches!(result,Err(bridge::RequestError::Transport(_))){guard.take();}
        result.map_err(|error|error.to_string())
    }).await.map_err(|_|"Bridge worker failed".to_string())?
}
