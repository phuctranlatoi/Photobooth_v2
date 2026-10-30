import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, CheckCircle2, CircleAlert, Cable, FlaskConical } from 'lucide-react';
import { bridge, type Bridge, type Health } from './bridge';
import { Simulator } from './Simulator';
export function App({ client = bridge }: { client?: Bridge }) {
  const [health, setHealth] = useState<Health>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [diagnostics,setDiagnostics]=useState(false);
  const latch = useRef(false), mounted = useRef(true);
  const reduce = useReducedMotion();
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function check() {
    if (latch.current) return;
    latch.current = true; setBusy(true); setError(''); setHealth(undefined);
    try { const result = await client.check(); if (mounted.current) setHealth(result); }
    catch (e) { if (mounted.current) setError(typeof e === 'string' ? e : e instanceof Error ? e.message : 'Bridge unavailable'); }
    finally { latch.current = false; if (mounted.current) setBusy(false); }
  }
  if(client===bridge&&!diagnostics)return <div className="simulator-app"><button className="diagnostic-toggle" onClick={()=>setDiagnostics(true)}>Bridge diagnostics</button><Simulator/></div>;
  return <div className="kiosk">
    <header><span className="wordmark">LE SOUVENIR</span><span className="badge"><FlaskConical size={18}/> V2 · ARCHITECTURE PROOF</span></header>
    <main>
      <section className="invitation"><p className="eyebrow">A little moment. A lasting memory.</p><h1>Make room<br/>for a memory.</h1><p className="intro">A new home for your favourite moments.<br/>The experience is taking shape.</p><button className="start" disabled aria-describedby="start-reason">Start your session <ArrowUpRight aria-hidden="true"/></button><p id="start-reason" className="muted">Customer integration pending. Sessions, camera, payment and printing are not available in this build.</p></section>
      <motion.section className="diagnostic" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .16 }} aria-labelledby="bridge-title">
        <div className="eyebrow flex items-center gap-3"><Cable size={20}/> PRIVATE STDIO BRIDGE</div><h2 id="bridge-title">Behind the experience.</h2><p>This diagnostic sends only <code>health.check</code> to the actual Kotlin/JVM backend through the desktop host.</p>
        <div className="notice"><FlaskConical size={22}/><div><strong>Simulator · health only</strong><p>No live preview. No device access.<br/>No customer or production actions.</p></div></div>
        <div role="status" aria-live="polite" className={`status ${error ? 'failure' : ''}`}>
          {busy ? <><span className="dot"/> Checking JVM connection…</> : health ? <><CheckCircle2 size={22}/> JVM responded · simulator confirmed</> : error ? <><CircleAlert size={22}/> Bridge unavailable</> : <><span className="dot"/> Not checked</>}
        </div>
        {error && <p role="alert" className="error">{error}</p>}
        {health && <dl><div><dt>Backend process</dt><dd>{health.backendPid}</dd></div><div><dt>JVM version</dt><dd>{health.jvmVersion}</dd></div><div><dt>Protocol</dt><dd>v{health.protocolVersion} · health.check only</dd></div><div><dt>Reported JVM uptime</dt><dd>{health.uptimeMs.toLocaleString()} ms</dd></div></dl>}
        <button className="check" onClick={check} disabled={busy}>{busy ? 'Checking…' : health ? 'Check again' : 'Check JVM bridge'}<ArrowUpRight size={22} aria-hidden="true"/></button>
        <p className="caption">A response proves this roundtrip only, not continuous health, packaging, Canon or printer support.</p>
      </motion.section>
     </main>{client===bridge&&<button className="check" onClick={()=>setDiagnostics(false)}>Return to simulator</button>}<footer><span>Designed for moments together.</span><span>Independent V2 development build · not for customer use</span></footer>
  </div>;
}
