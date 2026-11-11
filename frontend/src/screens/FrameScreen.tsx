import {type CSSProperties, useEffect, useRef, useState} from 'react';
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
  const isStrip = (layout?.printAspectRatio ?? 0) < 0.5;
  const frameRatio = layout?.printAspectRatio && layout.printAspectRatio > 0 ? layout.printAspectRatio : 1 / 3;
  const silhouette = frameRatio < 0.5
    ? {viewBox: '0 0 48 144', outer: {x: 4, y: 4, width: 40, height: 136, rx: 4}, border: {x: 6.5, y: 6.5, width: 35, height: 131, rx: 2.5}, mat: {x: 10, y: 12, width: 28, height: 106, rx: 2}, inner: {x: 13, y: 15, width: 22, height: 100, rx: 1}, textX: 24, textY: 130, fontSize: 4.2}
    : frameRatio <= 1.05
      ? {viewBox: '0 0 96 144', outer: {x: 6, y: 4, width: 84, height: 136, rx: 5}, border: {x: 9.5, y: 7.5, width: 77, height: 129, rx: 3}, mat: {x: 15, y: 14, width: 66, height: 102, rx: 2}, inner: {x: 19, y: 18, width: 58, height: 94, rx: 1}, textX: 48, textY: 129, fontSize: 6}
      : {viewBox: '0 0 144 96', outer: {x: 4, y: 6, width: 136, height: 84, rx: 5}, border: {x: 7.5, y: 9.5, width: 129, height: 77, rx: 3}, mat: {x: 14, y: 14, width: 116, height: 58, rx: 2}, inner: {x: 18, y: 18, width: 108, height: 50, rx: 1}, textX: 72, textY: 81, fontSize: 6};

  return <>
    <Heading step="Bước 5" title="Chọn khung trang trí"
      subtitle="Chọn khung phù hợp với khoảnh khắc" back={() => action('session.back')}/>
    <div className="v1-split v1-frame-workspace">
       <div className="v1-frame-preview-panel"><h2 className="v1-frame-preview-heading">Bản in xem trước</h2><PrintPreview src={backendPreviewMatches ? preview : undefined} ratio={layout?.printAspectRatio} layout={layout}
          selectedPhotos={backendPreviewMatches ? undefined : selectedPhotos}
           frameOverlayUrl={backendPreviewMatches ? undefined : frameArtwork}
          label={`Bản in xem trước · ${formatFrameName(selectedFrame?.name ?? 'Khung mặc định')} · ${layout?.printSizeLabel ?? ''}`}/></div>
      <div className={`v1-frame-grid ${isStrip ? 'v1-frame-grid-strip' : 'v1-frame-grid-standard'}`}>
        {frames.length ? frames.map(frame => {
          const thumb = safeImage(frame.thumbDataUrl) || safeImage(frame.thumbnailDataUrl) || safeImage(frame.previewDataUrl);
          const selected = effectiveFrameId === frame.id;
          return <button type="button" key={frame.id} aria-pressed={selected} onClick={() => handleUserFrameTap(frame.id)}>
            <span className="v1-frame-art-slot">
              <span className="v1-frame-art" style={{aspectRatio: frameRatio, '--frame-ratio': String(frameRatio)} as CSSProperties}>
              {thumb ? <img src={thumb} alt={formatFrameName(frame.name)}/> :
                <svg className="v1-frame-silhouette" viewBox={silhouette.viewBox} fill="none" aria-hidden="true">
                  <rect {...silhouette.outer} fill="#FFFCF7" stroke="#8E442D" strokeWidth="1.5"/>
                  <rect {...silhouette.border} stroke="#D8C7B5" strokeWidth=".7"/>
                  <rect {...silhouette.mat} fill="#F9F6F0" stroke="#C8B8A9" strokeWidth="1"/>
                  <rect {...silhouette.inner} stroke="#EDE6DF" strokeWidth=".7"/>
                  <text x={silhouette.textX} y={silhouette.textY} textAnchor="middle" fontFamily="var(--at-font-editorial)" fontSize={silhouette.fontSize} letterSpacing="0.03em" fill="#8E442D">LE SOUVENIR</text>
                </svg>}
              </span>
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
