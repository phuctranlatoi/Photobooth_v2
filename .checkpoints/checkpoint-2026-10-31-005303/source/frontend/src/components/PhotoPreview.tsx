import { useEffect, useRef } from 'react';

/** Browsing only: never changes the backend's selected order or photo state. */
export function PhotoPreview({src,label,onClose}:{src:string;label:string;onClose:()=>void}) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    close.current?.focus();
    return ()=>{if(previous?.isConnected)previous.focus();};
  },[]);
  return <div className="dialog-backdrop photo-preview-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section role="dialog" aria-modal="true" aria-label={label} className="photo-preview-dialog" onKeyDown={e=>{
      if(e.key==='Escape'){e.preventDefault();onClose();}
      if(e.key==='Tab'){e.preventDefault();close.current?.focus();}
    }}>
      <header><h2>{label}</h2><button className="check" ref={close} onClick={onClose}>Close preview</button></header>
      <div className="photo-preview-media"><img src={src} alt={label}/></div>
      <p>Original proportions · preview only. Your photo selection is unchanged.</p>
    </section>
  </div>;
}
