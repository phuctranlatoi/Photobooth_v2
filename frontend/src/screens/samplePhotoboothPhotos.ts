/**
 * Locally bundled sample photographs (Burst by Shopify; see src/assets/ASSET_ATTRIBUTION.md).
 * Illustrative gallery artwork only — never treated as customer capture or backend output.
 */
import photo01 from '../assets/photobooth-sample-01.jpg';
import photo02 from '../assets/photobooth-sample-02.jpg';
import photo03 from '../assets/photobooth-sample-03.jpg';
import photo04 from '../assets/photobooth-sample-04.jpg';

export const PHOTO_PEACE_VIBE = photo01;
export const PHOTO_CHEEK_HEART = photo02;
export const PHOTO_BUNNY_PROPS = photo03;
export const PHOTO_FINGER_HEART = photo04;

export const SAMPLE_PORTRAIT_PHOTOS = [
  PHOTO_PEACE_VIBE,
  PHOTO_CHEEK_HEART,
  PHOTO_BUNNY_PROPS,
  PHOTO_FINGER_HEART,
] as const;

export const SAMPLE_STRIP_PHOTOS = [
  PHOTO_BUNNY_PROPS,
  PHOTO_FINGER_HEART,
  PHOTO_CHEEK_HEART,
  PHOTO_PEACE_VIBE,
] as const;
