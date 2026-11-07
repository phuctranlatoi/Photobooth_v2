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

export function FrameScreen({layout, action, preview, snapshot, frames = [], frameId}: FrameProps) {
  const [localFrameId, setLocalFrameId] = useState<string | null>(frameId ?? null);
  const confirming = useRef(false);
  const desiredFrameId = useRef<string | null>(null);
  const mounted = useRef(true);
  const firstFrameId = frames[0]?.id;
  const effectiveFrameId = localFrameId ?? frameId ?? firstFrameId;

  useEffect(() => { mounted.current=true; return ()=>{mounted.current=false}; }, []);
  useEffect(() => {
    if (desiredFrameId.current === frameId) desiredFrameId.current=null;
    if (!desiredFrameId.current) setLocalFrameId(frameId ?? null);
  }, [frameId]);

  const handleUserFrameTap = (chosenId: string) => {
    if (chosenId === effectiveFrameId) { confirm(chosenId); return; }
    if (confirming.current) return;
    desiredFrameId.current=chosenId;
    setLocalFrameId(chosenId);
    try {void Promise.resolve(action('frame.select', {frameId: chosenId})).then(accepted=>{
      if(accepted===false && mounted.current && desiredFrameId.current===chosenId){desiredFrameId.current=null;setLocalFrameId(frameId??null)}
    }).catch(()=>{if(mounted.current&&desiredFrameId.current===chosenId){desiredFrameId.current=null;setLocalFrameId(frameId??null)}})}
    catch {desiredFrameId.current=null;setLocalFrameId(frameId??null)}
  };

  const confirm = (chosenId: string) => {
    if (confirming.current) return;
    confirming.current=true;
    try {void Promise.resolve(action('frame.confirm',{frameId:chosenId})).then(result=>{if(result===false)confirming.current=false}).catch(()=>{confirming.current=false})}
    catch {confirming.current=false}
  };

  const selectedFrame = frames.find(frame => frame.id === effectiveFrameId);
  const selectedPhotos = (snapshot?.selectedIndices ?? []).map(index => snapshot?.shots?.[index]?.preview);
  const frameArtwork = safeImage(selectedFrame?.thumbDataUrl) || safeImage(selectedFrame?.thumbnailDataUrl) || safeImage(selectedFrame?.previewDataUrl);
  const backendPreviewMatches = snapshot?.frameId === effectiveFrameId && !!safeImage(preview);

  return <>
    <Heading step="Bước 4" title="Chọn khung trang trí"
      subtitle="Chọn khung phù hợp với khoảnh khắc" back={() => action('session.back')}/>
    <div className="v1-split v1-frame-workspace">
       <div className="v1-frame-preview-panel"><h2 className="v1-frame-preview-heading">Bản in xem trước</h2><PrintPreview src={backendPreviewMatches ? preview : undefined} ratio={layout?.printAspectRatio} layout={layout}
          selectedPhotos={backendPreviewMatches ? undefined : selectedPhotos}
           frameOverlayUrl={backendPreviewMatches ? undefined : frameArtwork}
          label={`Bản in xem trước · ${formatFrameName(selectedFrame?.name ?? 'Khung mặc định')} · ${layout?.printSizeLabel ?? ''}`}/></div>
      <div className="v1-frame-grid">
        {frames.length ? frames.map(frame => {
          const thumb = safeImage(frame.thumbDataUrl) || safeImage(frame.thumbnailDataUrl) || safeImage(frame.previewDataUrl);
          const selected = effectiveFrameId === frame.id;
           return <button type="button" key={frame.id} aria-pressed={selected} onClick={() => handleUserFrameTap(frame.id)}>
             <span className="v1-frame-art" style={{aspectRatio:layout?.printAspectRatio && layout.printAspectRatio>0 ? layout.printAspectRatio : 1/3}}>
             {thumb ? <img src={thumb} alt={formatFrameName(frame.name)}/> :
               <svg className="v1-frame-silhouette" viewBox="0 0 96 112" fill="none" aria-hidden="true">
                 <rect x="8" y="4" width="80" height="104" rx="5" fill="#FFFCF7" stroke="#8E442D" strokeWidth="1.5"/>
                 <rect x="11" y="7" width="74" height="98" rx="3" stroke="#D8C7B5" strokeWidth=".7"/>
                 <rect x="17" y="14" width="62" height="70" rx="2" fill="#F9F6F0" stroke="#C8B8A9" strokeWidth="1"/>
                 <rect x="21" y="18" width="54" height="62" rx="1" stroke="#EDE6DF" strokeWidth=".7"/>
                 <text x="48" y="95" textAnchor="middle" fontFamily="Georgia,serif" fontSize="6" letterSpacing=".5" fill="#8E442D">LE SOUVENIR</text>
                </svg>}
             </span>
            <strong>{formatFrameName(frame.name)}</strong>
            {selected && <span className="v1-frame-check" aria-hidden="true"><Check size={16} strokeWidth={3}/></span>}
          </button>;
        }) : <p>Đang tải khung…</p>}
      </div>
    </div>
    <ActionBar><KioskSecondaryButton onClick={() => action('session.back')}>Quay lại</KioskSecondaryButton><KioskPrimaryButton disabled={!effectiveFrameId} onClick={() => {if(effectiveFrameId)confirm(effectiveFrameId)}}>Xem bản in →</KioskPrimaryButton></ActionBar>
  </>;
}
