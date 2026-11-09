/**
 * Authentic Korean Photobooth Sample Artworks
 * Depicts vibrant, playful moments (peace signs, cheek hearts, bunny props, finger hearts)
 * in warm Korean photo studio palettes.
 */

function toSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

// 01: Besties Peace Sign & Blush
export const PHOTO_PEACE_VIBE = toSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF2EA"/>
      <stop offset="100%" stop-color="#FCE1D0"/>
    </linearGradient>
    <radialGradient id="halo1" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#FFEEDF" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#FCE1D0" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="160" height="160" fill="url(#bg1)"/>
  <circle cx="80" cy="65" r="60" fill="url(#halo1)"/>

  <!-- Stars & photobooth ambiance -->
  <path d="M22 28l1.5 4.5L28 34l-4.5 1.5L22 40l-1.5-4.5L16 34l4.5-1.5z" fill="#E89B73" opacity="0.75"/>
  <path d="M140 32l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#E89B73" opacity="0.65"/>
  <path d="M136 78l1.2 3.8 3.8 1.2-3.8 1.2-1.2 3.8-1.2-3.8-3.8-1.2 3.8-1.2z" fill="#DFA482" opacity="0.5"/>

  <!-- Left Friend (Korean bob, peace sign, wink) -->
  <path d="M8 160c2-28 16-44 38-44s36 16 38 44z" fill="#F4EEE6"/>
  <path d="M34 116c4 6 18 6 22 0" stroke="#DFD5C8" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <rect x="40" y="98" width="10" height="18" fill="#FCE5D7" rx="3"/>
  <ellipse cx="45" cy="80" rx="22" ry="24" fill="#2D211B"/>
  <path d="M23 80c0 18 6 32 12 33s10-8 10-8" fill="#2D211B"/>
  <ellipse cx="45" cy="82" rx="17" ry="18" fill="#FDE9DE"/>
  <path d="M28 72c6-3 14-4 22-2 6 2 10 7 12 11-4-8-14-11-22-11-6 0-10 1-12 2z" fill="#2D211B"/>
  <circle cx="34" cy="89" r="4.5" fill="#F7A294" opacity="0.6"/>
  <circle cx="56" cy="89" r="4.5" fill="#F7A294" opacity="0.6"/>
  <path d="M33 81l4-2.5 4 2.5" stroke="#3D291F" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M50 79c2 3 6 3 8 0" stroke="#3D291F" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M44 84c.8 1 1.8 1 2 0" stroke="#D39682" stroke-width="1.2" stroke-linecap="round" fill="none"/>
  <path d="M40 89c2.5 3.5 7.5 3.5 10 0" stroke="#C3483A" stroke-width="2" stroke-linecap="round" fill="none"/>
  <g transform="translate(14, 68)">
    <path d="M12 28c-3-2-5-6-3-11l3-10c.8-2 3-2.5 4.5-1 1.5 1.5 1.5 3.5.5 5.5l-2 5 5-9c1-2 3.2-2.2 4.5-.8 1.4 1.4 1 3.5 0 5.5l-4 8c2-2 4-2 5 0s0 4-2 6l-3 4z" fill="#FCE5D7" stroke="#E3B3A0" stroke-width="1.2" stroke-linejoin="round"/>
  </g>

  <!-- Right Friend (Mocha waves, gold wire glasses, sweet smile) -->
  <path d="M76 160c3-26 18-42 40-42 20 0 34 16 38 42z" fill="#95A894"/>
  <path d="M102 118c4 6 18 6 22 0" stroke="#7A8D79" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <rect x="108" y="100" width="10" height="18" fill="#FCE5D7" rx="3"/>
  <ellipse cx="114" cy="80" rx="23" ry="26" fill="#3D2C22"/>
  <path d="M134 85c4 16 0 32-6 36s-8-6-8-6" fill="#3D2C22"/>
  <ellipse cx="113" cy="83" rx="17" ry="18" fill="#FDEADE"/>
  <path d="M96 74c6-5 18-7 26-2 5 3 8 9 9 14-3-9-11-14-20-14-8 0-13 1-15 2z" fill="#3D2C22"/>
  <circle cx="102" cy="90" r="4.5" fill="#F7A294" opacity="0.6"/>
  <circle cx="124" cy="90" r="4.5" fill="#F7A294" opacity="0.6"/>
  <circle cx="103" cy="82" r="6" fill="none" stroke="#C9A050" stroke-width="1.3"/>
  <circle cx="123" cy="82" r="6" fill="none" stroke="#C9A050" stroke-width="1.3"/>
  <path d="M109 82h8" stroke="#C9A050" stroke-width="1.3"/>
  <circle cx="103" cy="82" r="1.8" fill="#2E1F18"/>
  <circle cx="123" cy="82" r="1.8" fill="#2E1F18"/>
  <path d="M108 90c2.5 3 7.5 3 10 0" stroke="#C3483A" stroke-width="1.8" stroke-linecap="round" fill="none"/>

  <!-- Timestamp Stamp -->
  <rect x="10" y="142" width="76" height="12" rx="3" fill="#FFF" opacity="0.82"/>
  <text x="48" y="150.5" font-family="'Segoe UI',sans-serif" font-size="6" font-weight="700" fill="#8C5846" text-anchor="middle" letter-spacing="0.8">LE SOUVENIR · 01</text>
</svg>
`);

// 02: Cheek Heart / 볼하트
export const PHOTO_CHEEK_HEART = toSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FBF2FC"/>
      <stop offset="100%" stop-color="#EEDCF2"/>
    </linearGradient>
    <radialGradient id="halo2" cx="50%" cy="45%" r="45%">
      <stop offset="0%" stop-color="#F6E4FA" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#EEDCF2" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="160" height="160" fill="url(#bg2)"/>
  <circle cx="80" cy="72" r="58" fill="url(#halo2)"/>

  <!-- Floating hearts and sparkles -->
  <path d="M132 30c-2.5-3.5-7-2-7 2 0 4 7 9 7 9s7-5 7-9c0-4-4.5-5.5-7-2z" fill="#EAA8C9" opacity="0.85"/>
  <path d="M26 42c-1.8-2.5-5-1.5-5 1.5 0 3 5 6.5 5 6.5s5-3.5 5-6.5c0-3-3.2-4-5-1.5z" fill="#E8A0C2" opacity="0.75"/>
  <path d="M22 84l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#D39EC4" opacity="0.7"/>
  <path d="M138 90l1.2 3.8 3.8 1.2-3.8 1.2-1.2 3.8-1.2-3.8-3.8-1.2 3.8-1.2z" fill="#D39EC4" opacity="0.6"/>

  <!-- Body: Cozy oversized lavender sweater -->
  <path d="M25 160c4-36 24-52 55-52s51 16 55 52z" fill="#CBB8DF"/>
  <path d="M64 108c5 8 27 8 32 0" stroke="#B6A0CD" stroke-width="3" fill="none" stroke-linecap="round"/>
  <rect x="73" y="90" width="14" height="20" fill="#FCE5D7" rx="4"/>
  <ellipse cx="80" cy="70" rx="30" ry="34" fill="#241B18"/>
  <path d="M52 70c-2 24 4 42 10 46s10-8 10-8" fill="#241B18"/>
  <path d="M108 70c2 24-4 42-10 46s-10-8-10-8" fill="#241B18"/>
  <ellipse cx="80" cy="73" rx="22" ry="23" fill="#FDE9DE"/>
  <path d="M58 58c10-6 24-7 36-2 8 4 12 12 14 18-6-12-18-16-30-16-10 0-16 2-20 4z" fill="#241B18"/>
  <rect x="54" y="58" width="12" height="4" rx="2" fill="#FFF" transform="rotate(-15 54 58)"/>
  <circle cx="67" cy="82" r="6" fill="#F8A0B2" opacity="0.65"/>
  <circle cx="93" cy="82" r="6" fill="#F8A0B2" opacity="0.65"/>
  <ellipse cx="68" cy="72" rx="3.5" ry="4" fill="#241B18"/>
  <circle cx="67" cy="70.5" r="1.3" fill="#FFF"/>
  <ellipse cx="92" cy="72" rx="3.5" ry="4" fill="#241B18"/>
  <circle cx="91" cy="70.5" r="1.3" fill="#FFF"/>
  <path d="M64 68c2-2 6-2 9 0" stroke="#241B18" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M88 68c2-2 6-2 9 0" stroke="#241B18" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M74 81c2 4 10 4 12 0" stroke="#C9445E" stroke-width="2.2" stroke-linecap="round" fill="none"/>

  <!-- Cheek Heart Hand -->
  <g transform="translate(90, 68)">
    <path d="M8 18c6-2 14-8 12-16-1-4-5-5-8-3-4 3-8 9-9 14l-2 8c2 2 5 1 7-3z" fill="#FCE5D7" stroke="#E5B29E" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- Bottom Stamp -->
  <rect x="10" y="142" width="82" height="12" rx="3" fill="#FFF" opacity="0.85"/>
  <text x="51" y="150.5" font-family="'Segoe UI',sans-serif" font-size="6" font-weight="700" fill="#7D5194" text-anchor="middle" letter-spacing="0.8">SWEET MOMENT · 02</text>
</svg>
`);

// 03: Bunny Props & Playful Laugh
export const PHOTO_BUNNY_PROPS = toSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF8E7"/>
      <stop offset="100%" stop-color="#F5E8C8"/>
    </linearGradient>
    <radialGradient id="halo3" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#FEF2D5" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#F5E8C8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="160" height="160" fill="url(#bg3)"/>
  <circle cx="80" cy="75" r="60" fill="url(#halo3)"/>

  <!-- Bunny Headband (Fluffy ears) -->
  <g transform="translate(56, 12) rotate(-14)">
    <ellipse cx="8" cy="24" rx="9" ry="24" fill="#FFFFFF" stroke="#E6DAC8" stroke-width="1.2"/>
    <ellipse cx="8" cy="24" rx="5" ry="17" fill="#F9C3D2"/>
  </g>
  <g transform="translate(88, 10) rotate(16)">
    <ellipse cx="8" cy="24" rx="9" ry="24" fill="#FFFFFF" stroke="#E6DAC8" stroke-width="1.2"/>
    <ellipse cx="8" cy="24" rx="5" ry="17" fill="#F9C3D2"/>
  </g>
  <path d="M52 58c6-14 30-16 56 0" stroke="#FFFFFF" stroke-width="4.5" fill="none" stroke-linecap="round"/>

  <!-- Body: Terracotta warm hoodie -->
  <path d="M22 160c4-34 24-50 58-50s54 16 58 50z" fill="#C25A41"/>
  <path d="M66 110c4 7 24 7 28 0" stroke="#A94831" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M72 114v16M88 114v16" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
  <rect x="73" y="94" width="14" height="18" fill="#FCE5D7" rx="3"/>
  <ellipse cx="80" cy="76" rx="28" ry="30" fill="#3A281E"/>
  <ellipse cx="80" cy="78" rx="21" ry="22" fill="#FDEADE"/>
  <path d="M59 66c8-5 22-6 34-1 6 3 9 8 10 13-5-9-15-13-26-13-8 0-14 1-18 3z" fill="#3A281E"/>
  <circle cx="67" cy="86" r="6" fill="#F89D88" opacity="0.65"/>
  <circle cx="93" cy="86" r="6" fill="#F89D88" opacity="0.65"/>
  <path d="M64 74c2-4 7-4 9 0" stroke="#2B1D15" stroke-width="2.4" stroke-linecap="round" fill="none"/>
  <path d="M87 74c2-4 7-4 9 0" stroke="#2B1D15" stroke-width="2.4" stroke-linecap="round" fill="none"/>
  <path d="M71 85c2 8 16 8 18 0z" fill="#B33827"/>
  <path d="M75 85c1 3 9 3 10 0" fill="#FFFFFF"/>

  <!-- Paws pose -->
  <g transform="translate(42, 114)">
    <circle cx="10" cy="10" r="9" fill="#FCE5D7" stroke="#E3AE9A" stroke-width="1.2"/>
    <circle cx="7" cy="6" r="2.2" fill="#F7A898"/>
    <circle cx="13" cy="6" r="2.2" fill="#F7A898"/>
  </g>
  <g transform="translate(98, 114)">
    <circle cx="10" cy="10" r="9" fill="#FCE5D7" stroke="#E3AE9A" stroke-width="1.2"/>
    <circle cx="7" cy="6" r="2.2" fill="#F7A898"/>
    <circle cx="13" cy="6" r="2.2" fill="#F7A898"/>
  </g>

  <!-- Sparkles -->
  <path d="M136 44l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" fill="#E8A942" opacity="0.8"/>
  <path d="M22 64l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#E8A942" opacity="0.7"/>

  <!-- Bottom Stamp -->
  <rect x="10" y="142" width="86" height="12" rx="3" fill="#FFF" opacity="0.85"/>
  <text x="53" y="150.5" font-family="'Segoe UI',sans-serif" font-size="6" font-weight="700" fill="#A84C34" text-anchor="middle" letter-spacing="0.8">PLAYFUL ATELIER · 03</text>
</svg>
`);

// 04: K-Finger Heart & Beret
export const PHOTO_FINGER_HEART = toSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EEF5FC"/>
      <stop offset="100%" stop-color="#DBE7F6"/>
    </linearGradient>
    <radialGradient id="halo4" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#E8F1FC" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#DBE7F6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="160" height="160" fill="url(#bg4)"/>
  <circle cx="80" cy="72" r="58" fill="url(#halo4)"/>

  <!-- Chic Beret Hat -->
  <path d="M42 48c4-16 36-22 66-10 14 6 22 16 18 24-10 6-64 8-84-14z" fill="#1C1816"/>
  <circle cx="78" cy="34" r="2.5" fill="#1C1816"/>

  <!-- Body: Minimalist Ivory Mock Neck -->
  <path d="M25 160c4-34 24-50 55-50s51 16 55 50z" fill="#F4EEE8"/>
  <path d="M68 110c4 6 20 6 24 0" stroke="#DFD7CE" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <rect x="73" y="92" width="14" height="20" fill="#FCE5D7" rx="3"/>
  <ellipse cx="80" cy="72" rx="27" ry="29" fill="#28201C"/>
  <path d="M55 72c0 22 5 36 9 39" stroke="#28201C" stroke-width="8" stroke-linecap="round" fill="none"/>
  <ellipse cx="80" cy="75" rx="21" ry="22" fill="#FDEADE"/>
  <path d="M59 62c6-3 16-4 26 0 8 3 13 8 14 14-4-8-13-12-22-12-8 0-14 2-18 4z" fill="#28201C"/>
  <circle cx="68" cy="84" r="5.5" fill="#F6A090" opacity="0.6"/>
  <circle cx="92" cy="84" r="5.5" fill="#F6A090" opacity="0.6"/>
  <ellipse cx="69" cy="74" rx="3.5" ry="3.8" fill="#221915"/>
  <circle cx="68" cy="72.5" r="1.3" fill="#FFF"/>
  <ellipse cx="91" cy="74" rx="3.5" ry="3.8" fill="#221915"/>
  <circle cx="90" cy="72.5" r="1.3" fill="#FFF"/>
  <path d="M64 71c3-2 8-2 11 1" stroke="#221915" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M86 72c3-3 8-3 11-1" stroke="#221915" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M74 84c3 3 9 3 12 0" stroke="#C4483B" stroke-width="2" stroke-linecap="round" fill="none"/>

  <!-- Korean Finger Heart Gesture 🫰 -->
  <g transform="translate(90, 78)">
    <path d="M38 60c-10-8-22-20-22-30 0-4 3-7 7-6 4 1 7 4 8 7l4 8" fill="#FCE5D7" stroke="#E5B29E" stroke-width="1.2"/>
    <path d="M14 28c-3-2-5-6-3-9 2-3 6-3 8 0l3 4c1-3 4-5 7-3 3 2 3 6 0 9l-7 7z" fill="#FCE5D7" stroke="#E5B29E" stroke-width="1.2"/>
    <path d="M22 10c-2-3-6-1.5-6 1.8 0 3 6 7 6 7s6-4 6-7c0-3.3-4-4.8-6-1.8z" fill="#E84A5F"/>
  </g>

  <!-- Stars -->
  <path d="M24 38l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" fill="#4B86C8" opacity="0.65"/>
  <path d="M138 34l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#4B86C8" opacity="0.6"/>

  <!-- Bottom Stamp -->
  <rect x="10" y="142" width="80" height="12" rx="3" fill="#FFF" opacity="0.85"/>
  <text x="50" y="150.5" font-family="'Segoe UI',sans-serif" font-size="6" font-weight="700" fill="#3D6B9C" text-anchor="middle" letter-spacing="0.8">SEOUL VIBES · 04</text>
</svg>
`);

// Export standard arrays for portrait and strip
export const SAMPLE_PORTRAIT_PHOTOS: readonly string[] = [
  PHOTO_PEACE_VIBE,
  PHOTO_CHEEK_HEART,
  PHOTO_BUNNY_PROPS,
  PHOTO_FINGER_HEART,
];

export const SAMPLE_STRIP_PHOTOS: readonly string[] = [
  PHOTO_PEACE_VIBE,
  PHOTO_CHEEK_HEART,
  PHOTO_BUNNY_PROPS,
  PHOTO_FINGER_HEART,
];
