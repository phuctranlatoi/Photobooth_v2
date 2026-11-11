import {type CSSProperties, useEffect, useRef, useState} from 'react';
import {motion, useReducedMotion} from 'motion/react';
import {safeImage} from '../shared/connected-simulator';
import type {CatalogGetResult} from '../shared/simulator-contract';
import {KioskPrimaryButton} from './KioskUI';
import {LayoutArtwork} from './LayoutArtwork';
import {
  PHOTO_CHEEK_HEART,
  PHOTO_FINGER_HEART,
  SAMPLE_PORTRAIT_PHOTOS,
  SAMPLE_STRIP_PHOTOS,
} from './samplePhotoboothPhotos';

const EDITORIAL_EASE = [0.22, 1, 0.36, 1] as const;

export function StartScreen({
  layouts,
  bundles = [],
  defaultLayoutId,
  catalogSource,
  catalogReady = true,
  onStart,
  onAdmin,
  busy,
}: {
  layouts: CatalogGetResult['layouts'];
  bundles?: NonNullable<CatalogGetResult['bundles']>;
  defaultLayoutId?: string;
  catalogSource?: string;
  catalogReady?: boolean;
  lastSyncError?: string | null;
  onStart: (layoutId: string) => void;
  onAdmin: () => void;
  busy: boolean;
}) {
  const taps = useRef(0);
  const pressed = useRef(false);
  const [selected, setSelected] = useState<string | null>(null);
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    if (!busy) pressed.current = false;
  }, [busy]);

  const start = (id: string) => {
    if (pressed.current || busy || !catalogReady) return;
    pressed.current = true;
    onStart(id);
  };

  const layoutId = selected ?? (layouts.some(l => l.id === defaultLayoutId) ? defaultLayoutId : layouts[0]?.id);
  const unavailable = catalogReady && (catalogSource === 'UNAVAILABLE' || !layouts.length);
  const eventBundles = bundles.filter(b => layouts.some(l => l.id === b.layoutId) && safeImage(b.coverDataUrl));
  const portrait = layouts.find(l => l.printAspectRatio >= 0.5) ?? layouts[0];
  const strip = layouts.find(l => l.printAspectRatio < 0.5) ?? layouts.find(l => l.id !== portrait?.id);
  const startDisabled = busy || !catalogReady || !layoutId || unavailable;
  const singleLayout = Boolean(portrait && !strip);

  return (
    <div className="v1-start atelier-welcome">
      <div className="atelier-welcome-aurora" aria-hidden="true">
        <motion.span
          className="atelier-aurora-pool atelier-aurora-pool--1"
          animate={reduce ? {x: 0, y: 0, scale: 1} : {x: [0, 22, -10, 0], y: [0, -16, 12, 0], scale: [1, 1.06, 0.97, 1]}}
          transition={reduce ? {duration: 0} : {duration: 14, repeat: Infinity, ease: 'easeInOut'}}
        />
        <motion.span
          className="atelier-aurora-pool atelier-aurora-pool--2"
          animate={reduce ? {x: 0, y: 0, scale: 1} : {x: [0, -24, 14, 0], y: [0, 18, -14, 0], scale: [1, 0.96, 1.07, 1]}}
          transition={reduce ? {duration: 0} : {duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 0.8}}
        />
        <motion.span
          className="atelier-aurora-pool atelier-aurora-pool--3"
          animate={reduce ? {x: 0, y: 0, scale: 1} : {x: [0, 16, -18, 0], y: [0, 14, -10, 0], scale: [1, 1.05, 0.98, 1]}}
          transition={reduce ? {duration: 0} : {duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1.6}}
        />
      </div>

      <section className="atelier-welcome__copy">
        <motion.div
          className="atelier-welcome__brand-row"
          initial={reduce ? false : {opacity: 0.05, y: 10}}
          animate={{opacity: 1, y: 0}}
          transition={reduce ? {duration: 0} : {duration: 0.32, delay: 0, ease: EDITORIAL_EASE}}
        >
          <div className="atelier-brand-glass">
            <svg
              className="atelier-brand-seal"
              viewBox="0 0 32 32"
              width="26"
              height="26"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.25" strokeOpacity="0.6" />
              <circle cx="16" cy="16" r="9.5" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2.5" />
              <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="1.25" />
            </svg>
            <button
              type="button"
              className="v1-brand"
              data-admin-trigger="true"
              aria-label="LE SOUVENIR"
              onClick={() => {
                if (++taps.current >= 5) {
                  taps.current = 0;
                  onAdmin();
                }
              }}
            >
              LE SOUVENIR
            </button>
          </div>
        </motion.div>

        <motion.div
          className="atelier-welcome__message"
          initial={reduce ? false : {opacity: 0.05, y: 12}}
          animate={{opacity: 1, y: 0}}
          transition={reduce ? {duration: 0} : {duration: 0.34, delay: 0.07, ease: EDITORIAL_EASE}}
        >
          <h1>
            Lưu giữ khoảnh khắc
            <br />
            thanh xuân
            <span className="v1-editorial-accent">Yours forever.</span>
          </h1>
          <span className="atelier-accent-rule" aria-hidden="true" />
          <p className="v1-start-desc">Chụp ảnh lấy ngay · Đậm chất nghệ thuật Hàn Quốc</p>
        </motion.div>

        {unavailable && (
          <p className="atelier-welcome__unavailable" role="status">
            Chưa có bố cục khả dụng. Vui lòng liên hệ nhân viên.
          </p>
        )}

        <motion.div
          className="atelier-welcome__action"
          initial={reduce ? false : {opacity: 0.05, y: 12}}
          animate={{opacity: 1, y: 0}}
          transition={reduce ? {duration: 0} : {duration: 0.34, delay: 0.14, ease: EDITORIAL_EASE}}
        >
          <div className={`atelier-cta-frame${startDisabled ? ' is-disabled' : ''}`}>
            {!startDisabled && <span className="atelier-cta-glow" aria-hidden="true" />}
            <div className="atelier-cta-glass">
              <KioskPrimaryButton disabled={startDisabled} onClick={() => layoutId && start(layoutId)}>
                CHẠM ĐỂ BẮT ĐẦU →
              </KioskPrimaryButton>
            </div>
          </div>
          <p className="atelier-cta-note">Chạm để chọn bố cục yêu thích</p>
        </motion.div>
      </section>

      <aside className="v1-start-art" aria-label="Mẫu bản in LE SOUVENIR">
        <div className="atelier-welcome__gallery">
          <div className={`atelier-gallery-stage${singleLayout ? ' atelier-gallery-stage--single' : ''}`}>
            <span className="atelier-welcome__halo" aria-hidden="true" />
            <span className="atelier-gallery-arch" aria-hidden="true" />
            <span className="atelier-gallery-ticks" aria-hidden="true" />

            <motion.span
              className="atelier-glass-orb atelier-glass-orb--1"
              aria-hidden="true"
              animate={reduce ? {y: 0, x: 0, scale: 1} : {y: [0, -8, 0], x: [0, 3, 0], scale: [1, 1.04, 1]}}
              transition={reduce ? {duration: 0} : {duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2}}
            />
            <motion.span
              className="atelier-glass-orb atelier-glass-orb--2"
              aria-hidden="true"
              animate={reduce ? {y: 0, x: 0, scale: 1} : {y: [0, 7, 0], x: [0, -3, 0], scale: [1, 0.97, 1]}}
              transition={reduce ? {duration: 0} : {duration: 6.6, repeat: Infinity, ease: 'easeInOut', delay: 1.1}}
            />
            <motion.span
              className="atelier-glass-orb atelier-glass-orb--3"
              aria-hidden="true"
              animate={reduce ? {y: 0, x: 0, scale: 1} : {y: [0, -6, 0], x: [0, 4, 0], scale: [1, 1.03, 1]}}
              transition={reduce ? {duration: 0} : {duration: 7.2, repeat: Infinity, ease: 'easeInOut', delay: 2.0}}
            />

            <span className="atelier-gallery-ticket" aria-hidden="true">
              ATELIER 400 · 35MM
            </span>

            {portrait ? (
              <>
                <div className="atelier-gallery-slot atelier-gallery-slot--back" aria-hidden="true">
                  <motion.div
                    initial={reduce ? false : {opacity: 0.05, y: 14}}
                    animate={{opacity: 1, y: 0}}
                    transition={reduce ? {duration: 0} : {duration: 0.38, delay: 0.07, ease: EDITORIAL_EASE}}
                  >
                    <motion.div
                      animate={reduce ? {y: 0, rotate: 0} : {y: [0, -5, 0], rotate: [0, -0.6, 0]}}
                      transition={reduce ? {duration: 0} : {duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2}}
                    >
                      <div className="atelier-snapshot-card atelier-snapshot-card--back">
                        <div className="atelier-snapshot-photo">
                          <img src={PHOTO_FINGER_HEART} alt="" />
                        </div>
                        <div className="atelier-snapshot-meta">
                          <span className="atelier-snapshot-label">ATELIER</span>
                          <span className="atelier-snapshot-stamp">01</span>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>

                <div
                  className="atelier-gallery-slot atelier-gallery-slot--portrait"
                  style={{
                    '--print-ratio': String(portrait.printAspectRatio > 0 ? portrait.printAspectRatio : 0.667),
                  } as CSSProperties}
                >
                  <motion.div
                    initial={reduce ? false : {opacity: 0.05, y: 14}}
                    animate={{opacity: 1, y: 0}}
                    transition={reduce ? {duration: 0} : {duration: 0.38, delay: 0.14, ease: EDITORIAL_EASE}}
                  >
                    <motion.div
                      animate={reduce ? {y: 0, rotate: 0} : {y: [0, -5, 0], rotate: [0, 0.5, 0]}}
                      transition={reduce ? {duration: 0} : {duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay: 0.8}}
                    >
                      <figure
                        className="atelier-print atelier-print--portrait"
                        style={{aspectRatio: portrait.printAspectRatio}}
                      >
                        <LayoutArtwork compact layout={portrait} samplePhotos={SAMPLE_PORTRAIT_PHOTOS} />
                      </figure>
                    </motion.div>
                  </motion.div>
                </div>

                {strip && (
                  <div
                    className="atelier-gallery-slot atelier-gallery-slot--strip"
                    style={{
                      '--print-ratio': String(strip.printAspectRatio > 0 ? strip.printAspectRatio : 0.333),
                    } as CSSProperties}
                  >
                    <motion.div
                      initial={reduce ? false : {opacity: 0.05, y: 14}}
                      animate={{opacity: 1, y: 0}}
                      transition={reduce ? {duration: 0} : {duration: 0.38, delay: 0.21, ease: EDITORIAL_EASE}}
                    >
                      <motion.div
                        animate={reduce ? {y: 0, rotate: 0} : {y: [0, 5, 0], rotate: [0, -0.55, 0]}}
                        transition={reduce ? {duration: 0} : {duration: 5.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4}}
                      >
                        <figure
                          className="atelier-print atelier-print--strip"
                          style={{aspectRatio: strip.printAspectRatio}}
                        >
                          <LayoutArtwork compact layout={strip} samplePhotos={SAMPLE_STRIP_PHOTOS} />
                        </figure>
                      </motion.div>
                    </motion.div>
                  </div>
                )}

                <div className="atelier-gallery-slot atelier-gallery-slot--front" aria-hidden="true">
                  <motion.div
                    initial={reduce ? false : {opacity: 0.05, y: 14}}
                    animate={{opacity: 1, y: 0}}
                    transition={reduce ? {duration: 0} : {duration: 0.38, delay: 0.28, ease: EDITORIAL_EASE}}
                  >
                    <motion.div
                      animate={reduce ? {y: 0, rotate: 0} : {y: [0, -5, 0], rotate: [0, 0.65, 0]}}
                      transition={reduce ? {duration: 0} : {duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.1}}
                    >
                      <div className="atelier-snapshot-card atelier-snapshot-card--front">
                        <div className="atelier-snapshot-photo">
                          <img src={PHOTO_CHEEK_HEART} alt="" />
                        </div>
                        <div className="atelier-snapshot-meta">
                          <span className="atelier-snapshot-label">MOMENT</span>
                          <span className="atelier-snapshot-stamp">02</span>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </>
            ) : (
              <p className="atelier-welcome__empty">
                LE SOUVENIR
                <br />
                ATELIER
              </p>
            )}
          </div>

          <p className="atelier-art-caption">
            LE SOUVENIR · PHOTO ATELIER {portrait && <span>· MẪU MINH HỌA</span>}
          </p>
        </div>

        {eventBundles.length > 0 && (
          <div className="atelier-event-showcase" aria-label="Bộ sưu tập sự kiện">
            {eventBundles.map(bundle => (
              <button
                type="button"
                key={bundle.id}
                disabled={busy || !catalogReady || unavailable}
                aria-pressed={selected === bundle.layoutId}
                onClick={() => {
                  setSelected(bundle.layoutId);
                  start(bundle.layoutId);
                }}
              >
                <img src={safeImage(bundle.coverDataUrl)} alt="" />
                <span>{bundle.name}</span>
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
