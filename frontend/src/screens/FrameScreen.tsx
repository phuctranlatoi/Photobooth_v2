import {useEffect, useRef, useState} from 'react';
import {Check} from 'lucide-react';
import {safeImage} from '../shared/connected-simulator';
import type {FrameOption} from '../shared/simulator-contract';
import {ActionBar, Heading, KioskPrimaryButton, KioskSecondaryButton, PrintPreview, type ScreenProps} from './KioskUI';

export function formatFrameName(name: string) {
  const title = name.trim();
  if (!title) return 'Khung phong cách';
  if (!/[_\\/]|\.(?:png|jpe?g|webp)$|^\d{4,}/i.test(title)) return title;
  const cleaned = title.replace(/\.(?:png|jpe?g|webp)$/i, '')
    .replace(/[_\\/.-]+/g, ' ').replace(/\b\d{4,}\b/g, '')
    .replace(/\b(?:frame|khung|jpg|png)\b/gi, '').replace(/\s+/g, ' ').trim();
  return cleaned && /^[\p{L}]{3,}(?: [\p{L}]{3,})*$/u.test(cleaned)
    ? `Khung ${cleaned.charAt(0).toLocaleUpperCase('vi-VN')}${cleaned.slice(1)}`
    : 'Khung phong cách';
}

type FrameProps = ScreenProps & {frames?: FrameOption[]; frameId?: string | null};

export function FrameScreen({layout, busy, action, preview, snapshot, frames = [], frameId}: FrameProps) {
  const [localFrameId, setLocalFrameId] = useState<string | null>(frameId ?? null);
  const confirming = useRef(false);
  const desiredFrameId = useRef<string | null>(null);
  const mounted = useRef(true);
  const firstFrameId = frames[0]?.id;
  const effectiveFrameId = localFrameId || frameId || firstFrameId;

  useEffect(() => { mounted.current=true; return ()=>{mounted.current=false}; }, []);
  useEffect(() => {
    if (desiredFrameId.current === frameId) desiredFrameId.current=null;
    if (!desiredFrameId.current) setLocalFrameId(frameId ?? null);
  }, [frameId]);

  const handleUserFrameTap = (chosenId: string) => {
    if (busy || confirming.current) return;
    desiredFrameId.current=chosenId;
    setLocalFrameId(chosenId);
    try {void Promise.resolve(action('frame.select', {frameId: chosenId})).then(accepted=>{
      if(accepted===false && mounted.current && desiredFrameId.current===chosenId){desiredFrameId.current=null;setLocalFrameId(frameId??null)}
    }).catch(()=>{if(mounted.current&&desiredFrameId.current===chosenId){desiredFrameId.current=null;setLocalFrameId(frameId??null)}})}
    catch {desiredFrameId.current=null;setLocalFrameId(frameId??null)}
  };

  const selectedFrame = frames.find(frame => frame.id === effectiveFrameId);
  const selectedPhotos = (snapshot?.selectedIndices ?? []).map(index => snapshot?.shots?.[index]?.preview);

  return <>
    <Heading step="Bước 4 · Chọn khung trang trí" title="Chọn khung trang trí"
      subtitle="Chọn khung phù hợp với khoảnh khắc" back={() => action('session.back')}/>
    <div className="v1-split v1-frame-workspace">
      <div className="v1-frame-preview-panel"><div className="v1-frame-preview-heading"><h2>Bản in xem trước</h2><p>{formatFrameName(selectedFrame?.name ?? 'Khung mặc định')} · {layout?.printSizeLabel ?? ''}</p></div><PrintPreview src={preview} ratio={layout?.printAspectRatio} layout={layout}
        selectedPhotos={selectedPhotos}
        frameOverlayUrl={safeImage(selectedFrame?.thumbDataUrl) || safeImage(selectedFrame?.thumbnailDataUrl) || safeImage(selectedFrame?.previewDataUrl)}
         label="Bản in xem trước"/></div>
      <div className="v1-frame-grid">
        {frames.length ? frames.map(frame => {
          const thumb = safeImage(frame.thumbDataUrl) || safeImage(frame.thumbnailDataUrl) || safeImage(frame.previewDataUrl);
          const selected = effectiveFrameId === frame.id;
           return <button type="button" key={frame.id} aria-pressed={selected} disabled={busy} onClick={() => handleUserFrameTap(frame.id)}>
            {thumb ? <img src={thumb} alt={formatFrameName(frame.name)}/> :
              <svg className="v1-frame-silhouette" viewBox="0 0 96 112" fill="none" aria-hidden="true">
                <rect x="12" y="8" width="72" height="96" rx="5" stroke="currentColor" strokeWidth="4"/>
                <rect x="20" y="16" width="56" height="80" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="48" cy="45" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M28 82c2-15 10-23 20-23s18 8 20 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>}
            <strong>{formatFrameName(frame.name)}</strong>
            {selected && <span className="v1-frame-check" aria-hidden="true"><Check size={16} strokeWidth={3}/></span>}
          </button>;
        }) : <p>Đang tải khung…</p>}
      </div>
    </div>
    <ActionBar><KioskSecondaryButton onClick={() => action('session.back')}>Quay lại</KioskSecondaryButton><KioskPrimaryButton disabled={busy || !effectiveFrameId} onClick={() => {if(confirming.current)return;confirming.current=true;void Promise.resolve(action('frame.confirm',{frameId:effectiveFrameId})).then(result=>{if(result===false)confirming.current=false}).catch(()=>{confirming.current=false})}}>Xem bản in →</KioskPrimaryButton></ActionBar>
  </>;
}
