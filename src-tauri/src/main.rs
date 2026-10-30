#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod bridge;
use std::sync::{Arc,Mutex};
type Shared=Arc<Mutex<Option<bridge::Bridge>>>;
#[tauri::command]
async fn health_check(state:tauri::State<'_,Shared>)->Result<serde_json::Value,String>{
    let shared=state.inner().clone();
    tauri::async_runtime::spawn_blocking(move||{
        let mut guard=shared.lock().map_err(|_|"Bridge lock unavailable")?;
        if guard.is_none(){*guard=Some(bridge::Bridge::spawn()?)}
        let result=guard.as_mut().unwrap().check();
        if result.is_err(){guard.take();} // No automatic retry of an uncertain request.
        result
    }).await.map_err(|_|"Bridge worker failed".to_string())?
}
fn main(){
    let shared:Shared=Arc::new(Mutex::new(None));let closing=shared.clone();
    let app=tauri::Builder::default().manage(shared).invoke_handler(tauri::generate_handler![health_check,simulator_request])
        .build(tauri::generate_context!()).expect("V2 host initialization failed");
    app.run(move|_,event|{if matches!(event,tauri::RunEvent::Exit){if let Ok(mut guard)=closing.lock(){guard.take();}}});
}
#[tauri::command]
async fn simulator_request(state:tauri::State<'_,Shared>,method:String,params:serde_json::Value)->Result<serde_json::Value,String>{
    if !matches!(method.as_str(),"catalog.get"|"device.getStatus"|"session.start"|"session.confirmSetup"|"session.getState"|"session.cancel"|"session.finish"|"session.setLayout"|"session.setQuantity"|"session.back"|"payment.mockComplete"|"capture.startSequence"|"selection.toggle"|"selection.confirm"|"frame.list"|"frame.select"|"frame.confirm"|"print.confirmDryRun"){return Err("Method not permitted by simulator host".into())}
    if !params.is_object(){return Err("Simulator params must be an object".into())}
    let shared=state.inner().clone();
    tauri::async_runtime::spawn_blocking(move||{
        let mut guard=shared.lock().map_err(|_|"Bridge lock unavailable")?;
        if guard.is_none(){*guard=Some(bridge::Bridge::spawn()?)}
        // A domain rejection does not destroy an active session. Transport failures
        // are surfaced without replay; explicit reconnect is health-only.
        guard.as_mut().unwrap().request(&method,params)
    }).await.map_err(|_|"Bridge worker failed".to_string())?
}
