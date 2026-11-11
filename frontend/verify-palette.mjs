// LE SOUVENIR V2 - design token palette contrast verification
//
// Verifies the colour tokens published in docs/test_ui_design_tokens.md against
// WCAG 2.1 contrast requirements. Pure arithmetic, no browser, no dependencies.
//
// Run:  node frontend/verify-palette.mjs
// Exit: 0 = all required pairs pass, 1 = at least one failure.
//
// Method: WCAG 2.1 relative luminance -> (L1 + 0.05) / (L2 + 0.05).

const srgb = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

const luminance = (hex) => {
  const h = hex.replace('#', '');
  return (
    0.2126 * srgb(parseInt(h.slice(0, 2), 16)) +
    0.7152 * srgb(parseInt(h.slice(2, 4), 16)) +
    0.0722 * srgb(parseInt(h.slice(4, 6), 16))
  );
};

const contrast = (a, b) => {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

// ---------------------------------------------------------------------------
// Tokens (mirror of docs/test_ui_design_tokens.md section 2.2)
// ---------------------------------------------------------------------------
const T = {
  canvas: '#F5EFE4',
  ivory: '#FBF7F1',
  paper: '#FFFCF7',
  champTint: '#EFE2CB',
  roseTint: '#F3E1DC',
  rose: '#E3C4BB',
  matte: '#14110F',
  matteRaised: '#221E1A',
  ink: '#1C1917',
  body: '#4A4239',
  muted: '#6B6259',
  disabled: '#8A8177',
  champagne: '#C9A87C',
  champagneLight: '#E0C79E',
  champDeep: '#7F6136',
  champInk: '#75592F',
  roseInk: '#7E4034',
  hairline: '#D8CCBB',
  outlineChamp: '#96733F',
  focus: '#7F6136',
  stageOutline: '#7A6F63',
  stageHairline: '#4A423A',
  error: '#8F3029',
  success: '#245C42',
  stageError: '#C4614F',
  stageSuccess: '#7FB79A',
};

// [label, foreground, background, minimum ratio]
const REQUIRED = [
  ['Headline on canvas', T.ink, T.canvas, 4.5],
  ['Headline on ivory', T.ink, T.ivory, 4.5],
  ['Headline on paper', T.ink, T.paper, 4.5],
  ['Headline on champagne tint', T.ink, T.champTint, 4.5],
  ['Headline on rose tint', T.ink, T.roseTint, 4.5],
  ['Body on canvas', T.body, T.canvas, 4.5],
  ['Body on ivory', T.body, T.ivory, 4.5],
  ['Body on paper', T.body, T.paper, 4.5],
  ['Body on champagne tint', T.body, T.champTint, 4.5],
  ['Muted caption on canvas', T.muted, T.canvas, 4.5],
  ['Muted caption on paper', T.muted, T.paper, 4.5],
  ['Muted caption on champagne tint', T.muted, T.champTint, 4.5],
  ['Champagne ink on canvas', T.champInk, T.canvas, 4.5],
  ['Champagne ink on champagne tint', T.champInk, T.champTint, 4.5],
  ['Champagne deep on canvas', T.champDeep, T.canvas, 4.5],
  ['Champagne deep on paper', T.champDeep, T.paper, 4.5],
  ['Rose ink on canvas', T.roseInk, T.canvas, 4.5],
  ['Rose ink on rose tint', T.roseInk, T.roseTint, 4.5],
  ['Rose ink on rose fill', T.roseInk, T.rose, 4.5],
  ['Error on ivory', T.error, T.ivory, 4.5],
  ['Error on canvas', T.error, T.canvas, 4.5],
  ['Success on ivory', T.success, T.ivory, 4.5],
  ['Success on canvas', T.success, T.canvas, 4.5],
  ['Ivory on matte stage', T.ivory, T.matte, 4.5],
  ['Ivory on matte raised', T.ivory, T.matteRaised, 4.5],
  ['Champagne on matte stage', T.champagne, T.matte, 4.5],
  ['Champagne light on matte stage', T.champagneLight, T.matte, 4.5],
  ['Stage error on matte stage', T.stageError, T.matte, 4.5],
  ['Stage success on matte stage', T.stageSuccess, T.matte, 4.5],
  ['Matte on champagne fill', T.matte, T.champagne, 4.5],
  ['Ivory on champagne deep', T.ivory, T.champDeep, 4.5],
  ['Ivory on rose ink', T.ivory, T.roseInk, 4.5],
  ['Ivory on error', T.ivory, T.error, 4.5],
  ['Ivory on success', T.ivory, T.success, 4.5],
  ['Focus ring on canvas', T.focus, T.canvas, 3.0],
  ['Focus ring on ivory', T.focus, T.ivory, 3.0],
  ['Focus ring on paper', T.focus, T.paper, 3.0],
  ['Focus ring on rose tint', T.focus, T.roseTint, 3.0],
  ['Control outline on ivory', T.outlineChamp, T.ivory, 3.0],
  ['Control outline on paper', T.outlineChamp, T.paper, 3.0],
  ['Control outline on rose tint', T.outlineChamp, T.roseTint, 3.0],
  ['Stage control outline', T.stageOutline, T.matte, 3.0],
  ['Disabled label on canvas', T.disabled, T.canvas, 3.0],
  ['Disabled label on paper', T.disabled, T.paper, 3.0],
];

// Surfaces and hairlines that must NEVER be used to carry text.
// Asserted to stay below 3:1 so a misuse is visible during review.
const SURFACE_ONLY = [
  ['Hairline on canvas', T.hairline, T.canvas],
  ['Stage hairline on matte', T.stageHairline, T.matte],
  ['Rose fill on canvas', T.rose, T.canvas],
  ['Champagne tint on canvas', T.champTint, T.canvas],
  ['Ink on matte stage (must never happen)', T.ink, T.matte],
];

let failures = 0;

console.log('=== REQUIRED PAIRS ===');
for (const [label, fg, bg, min] of REQUIRED) {
  const ratio = contrast(fg, bg);
  const ok = ratio >= min;
  if (!ok) failures += 1;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2).padStart(6)}  (min ${min.toFixed(1)})  ${label}`,
  );
}

console.log('\n=== SURFACE-ONLY PAIRS (must stay below 3:1) ===');
for (const [label, fg, bg] of SURFACE_ONLY) {
  const ratio = contrast(fg, bg);
  const ok = ratio < 3.0;
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK  ' : 'WARN'}  ${ratio.toFixed(2).padStart(6)}  ${label}`);
}

console.log(`\n${REQUIRED.length} required pairs, ${SURFACE_ONLY.length} surface-only pairs, ${failures} failure(s).`);
process.exit(failures === 0 ? 0 : 1);
