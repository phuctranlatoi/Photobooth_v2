mod bridge;
fn main(){
    let mut host=bridge::Bridge::spawn().expect("spawn installed JVM launcher");
    let health=host.check().expect("private stdio health roundtrip");
    println!("{health}");
    assert!(host.shutdown(),"backend required forced shutdown");
    println!("EOF shutdown: launcher exited within deadline");
}
