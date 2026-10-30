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
    let app=tauri::Builder::default().manage(shared).invoke_handler(tauri::generate_handler![health_check])
        .build(tauri::generate_context!()).expect("V2 host initialization failed");
    app.run(move|_,event|{if matches!(event,tauri::RunEvent::Exit){if let Ok(mut guard)=closing.lock(){guard.take();}}});
}
