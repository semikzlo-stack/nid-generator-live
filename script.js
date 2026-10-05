// Canvas size, grid, and TMPLS are platform-dependent (see PLATFORMS/setActivePlatform
// below); everything else — margins, gaps, typography, badge rules, diamonds — is
// identical across every "readable" platform and stays a plain constant.
const MG = 60;
const GAP_CIRCLES_TEXT = 42; // gap between the circle composition and the text zone (top and bottom) — independent of MG
const TITLE_SUB_GAP = 42;    // gap between headline and subheading — independent of MG
const BOTTOM_MG = 72; // margin from canvas bottom edge to text, when circles are on top
const TOP_MG = 66;    // margin from canvas top edge to text, when circles are on bottom
const STEP_R = 0.813038;
// "recognition" formats (photo-only circle grids, no text — FB Event cover, YouTube
// cover…) have no text zone to anchor against, so their vertical margin is its own
// fixed constant rather than MG/GAP_CIRCLES_TEXT, and both top+bottom pin to it at
// once (see gridGeom's type:'photo' branch) — width is whatever falls out, centered.
const RECOGNITION_MG_V = 60;
// drawRedCircle's font sizes (sz=37/30/45/67/83…) were calibrated against Instagram's
// own D4 — the diameter of one circle in a 4-column grid on its 1080-wide canvas.
// A badge sized to match its own composition's circles (recognition formats with an
// own-size badge, e.g. YouTube cover) scales all of that proportionally instead of
// staying pinned to those absolute pixels — see drawRedCircle's type:'photo' branch.
const BADGE_CALIBRATION_D = (1080 - MG*2) / (1 + STEP_R*3);
const T_SIZES   = [152, 137, 124, 112, 101, 92, 83, 75, 67, 55, 45];
const T_LEADING = [156, 141, 127, 115, 104, 94, 85, 77, 69, 63, 52];
const T_TRACK   = [-0.03, -0.03, -0.02, -0.02, -0.02, -0.02, -0.02, -0.02, -0.02, -0.01, -0.01];
const S_SIZE = 37, S_LEAD = 46, S_TRACK = -0.01;
// The Facebook announcement's two blob compositions cap how far down the size ladder
// text may shrink before falling back to a different composition, instead of
// wrapping into a visually cramped small size: 2×2 only gets the largest size and
// the one below it; 4×4 gets three steps. Other blob compositions (e.g. Instagram's
// 4×5) keep the full ladder.
function blobSizeLimit(t){
  if(t.c===2 && t.r===2) return 1;
  if(t.c===4 && t.r===4) return 2;
  return T_SIZES.length-1;
}

// Canvas stand-in headline shown while the title is still empty — localized,
// since it's drawn into the post itself (and every thumbnail) rather than
// being a placeholder attribute. Kept outside I18N on purpose: the first
// canvas draw runs before the I18N table below is initialized.
const POST_TITLE_FALLBACK = { en: 'Post title', pl: 'Tytuł posta' };
function fallbackTitle(){ return POST_TITLE_FALLBACK[state.lang] || POST_TITLE_FALLBACK.en; }

const PALETTE = [
  {name:'Sand',    bg:'#FFF3E7', text:'#2E2A25'},
  {name:'Rust',    bg:'#AA1F08', text:'#FFFFFF'},
  {name:'Brick',   bg:'#EE6F40', text:'#2E2A25'},
  {name:'Terra',   bg:'#F6A673', text:'#2E2A25'},
  {name:'Amber',   bg:'#FBC47D', text:'#2E2A25'},
  {name:'PatynaL', bg:'#CBE3C4', text:'#2E2A25'},
  {name:'Patyna',  bg:'#65BC99', text:'#2E2A25'},
  {name:'Teal',    bg:'#0B6B6C', text:'#FFFFFF'},
];
// All colors available for blob fill (including Red for accents)
const BLOB_PALETTE = [
  {name:'Sand',    bg:'#FFF3E7', text:'#2E2A25'},
  {name:'Rust',    bg:'#AA1F08', text:'#FFFFFF'},
  {name:'Brick',   bg:'#EE6F40', text:'#2E2A25'},
  {name:'Terra',   bg:'#F6A673', text:'#2E2A25'},
  {name:'Amber',   bg:'#FBC47D', text:'#2E2A25'},
  {name:'PatynaL', bg:'#CBE3C4', text:'#2E2A25'},
  {name:'Patyna',  bg:'#65BC99', text:'#2E2A25'},
  {name:'Teal',    bg:'#0B6B6C', text:'#FFFFFF'},
];

// Facebook Announcement's curated (background, circle) pairing — one per
// standard palette color, indexed the same as PALETTE/BLOB_PALETTE (0 Sand,
// 1 Rust, 2 Brick, 3 Terra, 4 Amber, 5 PatynaL, 6 Patyna, 7 Teal). The row
// itself is the ordinary 8-circle standard palette (each swatch still shows
// only its own background color, per PALETTE_VISUAL_ORDER); picking one also
// sets the paired circle color for the format's two-tone render. Reuses the
// pairings the old 14-entry combo list already had for every background it
// covered; Rust and Brick never had one there, so those two are new.
const PALETTE_BLOB_PAIR = [
  /*0 Sand   */ 6, // + Patyna
  /*1 Rust   */ 0, // + Sand
  /*2 Brick  */ 0, // + Sand
  /*3 Terra  */ 0, // + Sand
  /*4 Amber  */ 3, // + Terra
  /*5 PatynaL*/ 6, // + Patyna
  /*6 Patyna */ 5, // + PatynaL
  /*7 Teal   */ 5, // + PatynaL
];

// 44 templates
const TMPLS_INSTAGRAM = [
  // grey no diamond top — TEXT templates (free zone), shown first
  {c:4,r:4,pos:'top',   type:'grey',  rc:true },
  {c:2,r:2,pos:'top',   type:'grey',  rc:true },
  {c:1,r:1,pos:'top',   type:'grey',  rc:true },
  {c:4,r:3,pos:'top',   type:'grey',  rc:true },
  {c:5,r:4,pos:'top',   type:'grey',  rc:false},
  {c:3,r:3,pos:'top',   type:'grey',  rc:false},
  {c:5,r:3,pos:'top',   type:'grey',  rc:false},
  {c:3,r:2,pos:'top',   type:'grey',  rc:false},
  {c:5,r:2,pos:'top',   type:'grey',  rc:false},
  // grey no diamond bottom
  {c:4,r:4,pos:'bottom',type:'grey',  rc:true },
  {c:2,r:2,pos:'bottom',type:'grey',  rc:true },
  {c:1,r:1,pos:'bottom',type:'grey',  rc:true },
  {c:4,r:3,pos:'bottom',type:'grey',  rc:true },
  {c:5,r:4,pos:'bottom',type:'grey',  rc:false},
  {c:3,r:3,pos:'bottom',type:'grey',  rc:false},
  {c:5,r:3,pos:'bottom',type:'grey',  rc:false},
  {c:3,r:2,pos:'bottom',type:'grey',  rc:false},
  {c:5,r:2,pos:'bottom',type:'grey',  rc:false},
  // grey diamond — photo-only
  {c:4,r:3,pos:'top',   type:'grey-d',rc:true },
  {c:2,r:2,pos:'top',   type:'grey-d',rc:true },
  {c:3,r:3,pos:'top',   type:'grey-d',rc:false},
  {c:4,r:4,pos:'top',   type:'grey-d',rc:false},
  {c:3,r:2,pos:'top',   type:'grey-d',rc:false},
  {c:4,r:3,pos:'bottom',type:'grey-d',rc:true },
  {c:2,r:2,pos:'bottom',type:'grey-d',rc:true },
  {c:4,r:4,pos:'bottom',type:'grey-d',rc:true },
  {c:3,r:3,pos:'bottom',type:'grey-d',rc:false},
  {c:3,r:2,pos:'bottom',type:'grey-d',rc:false},

];

// Facebook post (1050×1050, square). Same margins/gaps/typography/badge-rule/diamond
// code as Instagram — only the canvas size and this grid list differ. Badge rule:
// rc:true exactly when the composition has 1, 2, or 4 circles per horizontal row.
const TMPLS_FACEBOOK = [
  {c:4,r:3,pos:'top',   type:'grey', rc:true },
  {c:4,r:3,pos:'bottom',type:'grey', rc:true },
  {c:3,r:2,pos:'top',   type:'grey', rc:false},
  {c:3,r:2,pos:'bottom',type:'grey', rc:false},
  {c:5,r:4,pos:'top',   type:'grey', rc:false},
  {c:5,r:4,pos:'bottom',type:'grey', rc:false},
  {c:6,r:4,pos:'top',   type:'grey', rc:false},
  {c:6,r:4,pos:'bottom',type:'grey', rc:false},
  {c:6,r:3,pos:'top',   type:'grey', rc:false},
  {c:6,r:3,pos:'bottom',type:'grey', rc:false},
];

// Facebook announcement (1050×1050, text only — no photo). Headline sits inside the
// circle grid itself (type 'blob'), the grid is always bottom-anchored, and the red
// badge is mandatory, so every composition here carries rc:true.
// 4×4 comes first: when text fits neither composition, buildFilmstrip's "nothing
// fits anywhere" fallback force-renders template 0 regardless — the more spacious
// grid overflows less badly than 2×2 would in that same worst case.
const TMPLS_FACEBOOK_TEXT = [
  {c:4,r:4,pos:'bottom',type:'blob',rc:true},
  {c:2,r:2,pos:'bottom',type:'blob',rc:true},
];

// Instagram announcement (1080×1350, text only — no photo). Same format as the
// Facebook announcement, but a 4×5 grid doesn't land on an exact MG margin either
// way on this taller canvas, so it's just vertically centered (pos:'center') —
// left/right stay at the normal 60px margin since that's driven by the column count.
const TMPLS_INSTAGRAM_TEXT = [
  {c:4,r:5,pos:'center',type:'blob',rc:true},
];

// FB Event cover (1920×1005, "recognition" path — photo only, no text/badge at all).
// type:'photo' reuses the grey-type photo/diamond rendering wholesale (see drawPost)
// but skips text entirely; its geometry in gridGeom is the mirror image of the text
// formats' — vertical margin (RECOGNITION_MG_V) is the fixed constraint that derives
// the diameter, and the resulting width is simply centered, with no side margin.
const TMPLS_FB_EVENT = [
  {c:4,r:2,type:'photo'},
  {c:6,r:3,type:'photo'},
];

// YouTube cover (1280×720, "recognition" path — same photo-only circle grid as FB
// Event cover, but with an OPTIONAL red badge). type:'photo' and its geometry are
// reused as-is (same height-driven formula, same RECOGNITION_MG_V). rc:true only on
// the 4×2 grid — once badge content exists, getValidTemplates()'s existing rc-filter
// drops the 6×3 option automatically, no new filtering logic needed.
const TMPLS_YOUTUBE = [
  {c:4,r:2,type:'photo',rc:true},
  {c:6,r:3,type:'photo',rc:false},
];

// Single source of truth for every output platform/format. "readable" platforms
// share one wizard and one rendering path — canvas size + templates are the only
// per-platform data. aliasOf is for a future platform identical to another in
// every way except its label (none yet). hasPhoto/hasTitle/hasSubheading/badgeRequired
// gate which sections renderFormPage/renderDetailsPage show (see selectPlatform).
// photoRequired:false marks a platform (YouTube) whose photo is optional rather
// than the hasPhoto default of required. hasBadge opts a photo-only recognition
// platform into the same optional date/rubric badge readable/text formats use.
// Every carrier format shows the same full 8-color standard palette — no
// format-specific swatch exclusion (NID_Generator_Save_Arc_And_Password_
// Completion.md §3).
const PLATFORMS = [
  { id:'instagram',     canvas:{w:1080,h:1350}, kind:'readable',    aliasOf:null, templates:TMPLS_INSTAGRAM,
    hasPhoto:true,  hasTitle:true,  hasSubheading:true,  badgeRequired:false },
  { id:'facebook',      canvas:{w:1050,h:1050}, kind:'readable',    aliasOf:null, templates:TMPLS_FACEBOOK,
    hasPhoto:true,  hasTitle:true,  hasSubheading:true,  badgeRequired:false },
  { id:'facebookText',  canvas:{w:1050,h:1050}, kind:'text',        aliasOf:null, templates:TMPLS_FACEBOOK_TEXT,
    hasPhoto:false, hasTitle:true,  hasSubheading:false, badgeRequired:true },
  { id:'instagramText', canvas:{w:1080,h:1350}, kind:'text',        aliasOf:null, templates:TMPLS_INSTAGRAM_TEXT,
    hasPhoto:false, hasTitle:true,  hasSubheading:false, badgeRequired:true },
  { id:'fbEvent',       canvas:{w:1920,h:1005}, kind:'recognition', aliasOf:null, templates:TMPLS_FB_EVENT,
    hasPhoto:true,  hasTitle:false, hasSubheading:false, badgeRequired:false },
  { id:'youtube',       canvas:{w:1280,h:720},  kind:'recognition', aliasOf:null, templates:TMPLS_YOUTUBE,
    hasPhoto:true,  hasTitle:false, hasSubheading:false, badgeRequired:false, hasBadge:true, photoRequired:false },
  // Identical to Instagram in every way except its label — same canvas, same
  // templates, same flags. This is exactly the case aliasOf was reserved for.
  { id:'linkedin',      canvas:{w:1080,h:1350}, kind:'readable',    aliasOf:'instagram', templates:TMPLS_INSTAGRAM,
    hasPhoto:true,  hasTitle:true,  hasSubheading:true,  badgeRequired:false },
];

const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');
let SCALE = 1;

const state = {
  title:'', date:'', topic:'', subheading:'',
  showDate:false, showTopic:false, showSubheading:false,
  colorIdx:0, blobColorIdx:0, tmplIdx:0, showDiamonds:true,
  image:null, offX:0, offY:0, imgScale:1,
  adjusting:false, hasDraggedPhoto:false,
  // Part V: whether the CURRENT photo+area combo has ever been manually
  // zoomed/dragged — a fresh combo always opens Adjust Photo at genuine
  // Fill/Cover (slider at 0); one the user already adjusted (or a draft's own
  // saved framing) reopens exactly where they left it. Reset by a new photo
  // upload, a platform switch, or picking a different generated variant —
  // each can change the photo area, so a leftover imgScale from the old area
  // would otherwise read as a spurious zoom (drawImg's cover clamp only ever
  // raises imgScale, never lowers an over-scaled leftover back down).
  imgScaleManual:false,
  drafts:[], saved:[],
  lang:'en',
  platformId:'instagram',
};

// Every rendering/fit-check function already reads PW/PH/GRID_W/TMPLS as plain
// module-scope variables, so switching platform is just reassigning these four —
// nothing else in the file needs to know a platform switch happened.
let PW, PH, GRID_W, TMPLS, activePlatform;
function setActivePlatform(id){
  const p = PLATFORMS.find(x => x.id === id);
  if(!p) return;
  activePlatform = p;
  state.platformId = p.id;
  PW = p.canvas.w; PH = p.canvas.h;
  GRID_W = PW - MG*2;
  TMPLS = p.templates;
  state.tmplIdx = 0;
  // Fresh combo default for any blob (badge-required) format — a two-palette pick wouldn't map onto it.
  if(p.badgeRequired){ state.colorIdx = 7; state.blobColorIdx = PALETTE_BLOB_PAIR[7]; }
  applyEditorLayout();
}

// Final-editor geometry per format (MAIN_PREVIEW_SIZES_AND_POSITIONS.md,
// 1728×1040 reference, refining FINAL_EDITOR_CORRECTIONS.md — supersedes
// UI_SPEC.md §13's two-profile tall/wide system and its per-format strip-
// position override table). Five named, individually measured box profiles:
// portrait splits by hasPhoto (a photo post sits 6.46px lower than a text
// post at the same size — measured, not derived), square covers both
// Facebook photo and text posts identically (the visible square is centered
// inside a taller shared container, but what matters here is just the square
// itself), and the two landscape "recognition" formats (fbEvent, youtube)
// each have their own x/y/w/h, not one shared "wide" formula. The small
// thumbnail strip aligns to the box's own top-left corner (x+w+44, y) for
// every format, per FINAL_EDITOR_CORRECTIONS.md's "same 44px gap, same top
// edge, for every format" rule.
//
// x values below are the spec's own 1728-wide-frame numbers minus PANEL_W —
// .final-stage (see applyStageScale) is everything right of .panel, so its
// own coordinate space starts where the panel ends, not at the frame's true
// left edge. Written as "spec value - PANEL_W" rather than pre-subtracted so
// the numbers stay traceable back to the correction doc.
const PANEL_W = 404; // #finalPage .panel's actual rendered width (44px inset + 360px content) — see style.css
const EDITOR_BOX = {
  portraitPhoto: { x:651-PANEL_W,    y:50.46,  w:616,    h:769.54 },
  portraitText:  { x:651-PANEL_W,    y:44,     w:616,    h:769.54 },
  square:        { x:651-PANEL_W,    y:120.75, w:616.03, h:616.03 },
  fbEvent:       { x:519.64-PANEL_W, y:223.46, w:913.13, h:477.97 },
  youtube:       { x:520.15-PANEL_W, y:205.78, w:912.59, h:513.33 },
};

function editorBoxKey(){
  if(activePlatform.id === 'fbEvent') return 'fbEvent';
  if(activePlatform.id === 'youtube') return 'youtube';
  if(PW === PH) return 'square';
  return activePlatform.hasPhoto ? 'portraitPhoto' : 'portraitText';
}

function applyEditorLayout(){
  const root = document.getElementById('finalPage');
  if(!root || !PW || !PH) return;
  const box = EDITOR_BOX[editorBoxKey()];
  root.style.setProperty('--box-x', box.x + 'px');
  root.style.setProperty('--box-y', box.y + 'px');
  root.style.setProperty('--box-w', box.w + 'px');
  root.style.setProperty('--box-h', box.h + 'px');
  // Unitless (Part V's Adjust Photo stage uses this in aspect-ratio, which
  // rejects px values — CSS <ratio> is plain numbers only). PW/PH is also the
  // exact canvas ratio, avoiding box.w/box.h's own small measured rounding.
  root.style.setProperty('--box-ratio', PW / PH);
  // The 616px button/link group sits flush under the two 616px-wide preview
  // boxes (portrait/square) and centers under the two 913px-wide ones
  // (fbEvent/youtube) — the correction gives the vertical gap for those two
  // explicitly but not this horizontal placement, so centering is this
  // implementation's own reasonable choice, not a measured value.
  root.style.setProperty('--actions-x', (box.x + (box.w - 616) / 2) + 'px');
  root.style.setProperty('--strip-x', (box.x + box.w + 44) + 'px');
  root.style.setProperty('--strip-y', box.y + 'px');
  // Tile heights (fixed width, aspect-derived height) for the drafts grid and
  // the suggestions strip — same formula, different fixed width (84 / 82px).
  root.style.setProperty('--draft-tile-h', (84 * PH / PW) + 'px');
  const stripTileH = 82 * PH / PW;
  root.style.setProperty('--strip-tile-h', stripTileH + 'px');
  // Reference/maximum window: 4 full cards + 4 gaps + half a 5th card
  // (NID_Generator_Corrections.md — supersedes the earlier 6-full-card
  // window). updateVariantsColVisibility() clamps this down further, per
  // render, to the actual content height when there are fewer variants.
  root.style.setProperty('--strip-visible-h', (4.5 * stripTileH + 4 * 8) + 'px');
}

const STAGE_W = 1728 - PANEL_W, STAGE_H = 1040;
// Uniform proportional scaling for other window sizes (FINAL_EDITOR_CORRECTIONS.md
// "на другом размере окна адаптировать превью пропорционально") — one CSS
// transform:scale() on the whole stage (preview box + strip + action row +
// reuse link) keeps every one of their relative positions exactly as
// measured, rather than recomputing each custom property at a new scale.
// The panel itself is excluded (fixed 400px, its own independent scroll) and
// stays crisp/readable at any window size instead of shrinking with it.
// transform-origin defaults to the element's own center, which combined with
// the viewport's flex centering keeps the scaled stage visually centered.
// Suppressed during adjust-mode via CSS (body.is-adjusting .final-stage —
// see style.css) since that mode's own position:fixed full-screen takeover
// would otherwise be contained by this transform instead of the true
// viewport; adjust mode doesn't depend on the stage's own scale/position at
// all once it goes fixed, so removing the transform there is a no-op visually.
function applyStageScale(){
  const viewport = document.querySelector('.final-stage-viewport');
  const stage = document.getElementById('finalStage');
  if(!viewport || !stage) return;
  const availW = viewport.clientWidth, availH = viewport.clientHeight;
  if(availW <= 0 || availH <= 0) return;
  const k = Math.min(availW / STAGE_W, availH / STAGE_H);
  stage.style.transform = 'scale(' + k + ')';
}
setActivePlatform('instagram'); // default until the platform-picker screen runs

function setupCanvas() {
  applyStageScale();
  const area = document.querySelector('.final-canvas-wrap');
  if(!area) return;
  // .final-main is now exactly the measured preview box (MAIN_PREVIEW_SIZES_AND_POSITIONS.md)
  // with no padding of its own, so the canvas should cover .final-canvas-wrap's
  // full area — no arbitrary margin subtracted here any more.
  const mw = area.clientWidth;
  const mh = area.clientHeight;
  if(mw <= 0 || mh <= 0) return; // page not visible yet — recalculated when it becomes visible
  SCALE = Math.min(mw/PW, mh/PH);
  const dpr = window.devicePixelRatio || 1;
  // Physical pixels = logical pixels × dpr — sharp on Retina
  canvas.width  = PW * dpr;
  canvas.height = PH * dpr;
  canvas.style.width  = (PW * SCALE) + 'px';
  canvas.style.height = (PH * SCALE) + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function calcD(n) { return GRID_W / (1 + STEP_R*(n-1)); }

function gridGeom(t) {
  if(t.type==='photo'){
    // Recognition formats: height is the fixed constraint (RECOGNITION_MG_V pinned
    // on both top and bottom at once), so the diameter is derived from height, not
    // width — the mirror of the formula below — and the resulting width is centered
    // with no side margin at all.
    const targetH = PH - RECOGNITION_MG_V*2;
    const D = targetH / (1 + STEP_R*(t.r-1));
    const s = STEP_R * D;
    const th = D + s*(t.r-1);
    const tw = D + s*(t.c-1);
    const x0 = (PW-tw)/2;
    const y0 = RECOGNITION_MG_V;
    return {D, s, x0, y0, tw, th};
  }
  const D = calcD(t.c);
  const s = STEP_R * D;
  const tw = D + s*(t.c-1);
  const th = D + s*(t.r-1);
  const x0 = MG + (GRID_W-tw)/2;
  // pos:'center' — for compositions that don't land on an exact MG margin either way
  // (e.g. 4×5 on the Instagram canvas), just center the whole grid vertically instead.
  const y0 = t.pos==='top' ? MG : t.pos==='center' ? (PH-th)/2 : PH-MG-th;
  return {D, s, x0, y0, tw, th};
}

function circlePath(t) {
  const {D,s,x0,y0} = gridGeom(t);
  const R = D/2;
  ctx.beginPath();
  for(let row=0;row<t.r;row++) for(let col=0;col<t.c;col++) {
    const cx=x0+R+col*s, cy=y0+R+row*s;
    ctx.moveTo(cx+R,cy);
    ctx.arc(cx,cy,R,0,Math.PI*2);
  }
}

function coverScale(img, areaW, areaH) {
  // Minimum scale so image fully covers the area (object-fit: cover)
  return Math.max(areaW / img.width, areaH / img.height);
}

function drawImg(clipY, clipH, clipW) {
  const areaW = clipW !== undefined ? clipW : PW;
  const areaX = (PW - areaW) / 2; // horizontal center of clip area

  if(!state.image) {
    ctx.fillStyle='#6a6a6a';
    ctx.fillRect(0, clipY, PW, clipH);
    ctx.save();
    ctx.strokeStyle='#888'; ctx.lineWidth=10;
    const ix=PW/2-90, iy=clipY+clipH/2-70, iw=180, ih=140;
    roundRect(ctx,ix,iy,iw,ih,12); ctx.stroke();
    ctx.beginPath();
    ctx.arc(ix+iw*0.65, iy+ih*0.3, ih*0.18, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ix+10,iy+ih-10);
    ctx.lineTo(ix+iw*0.4,iy+ih*0.45);
    ctx.lineTo(ix+iw*0.6,iy+ih*0.65);
    ctx.lineTo(ix+iw*0.75,iy+ih*0.5);
    ctx.lineTo(ix+iw-10,iy+ih-10);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const img = state.image;
  const minSc = coverScale(img, areaW, clipH);
  // Clamp imgScale so user can't zoom out below cover minimum
  if(state.imgScale < minSc) state.imgScale = minSc;
  const sc = state.imgScale;
  const dw = img.width * sc, dh = img.height * sc;
  const dx = areaX + (areaW - dw) / 2 + state.offX;
  const dy = clipY + (clipH - dh) / 2 + state.offY;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, clipY, PW, clipH); ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function roundRect(ctx,x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

function wrapText(text, maxW, sz, track) {
  ctx.font = '500 '+sz+'px NocturneSans';
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for(const w of words) {
    const test = cur ? cur+' '+w : w;
    if(measureT(test,track,sz)>maxW && cur) { lines.push(cur); cur=w; }
    else cur=test;
  }
  if(cur) lines.push(cur);
  return lines;
}

function measureT(text, track, sz) {
  ctx.font = '500 '+sz+'px NocturneSans';
  ctx.letterSpacing = (track*sz) + 'px';
  const w = ctx.measureText(text).width;
  ctx.letterSpacing = '0px';
  return w;
}

function fillT(text, x, y, track, sz) {
  ctx.letterSpacing = (track*sz) + 'px';
  ctx.fillText(text, x, y);
  ctx.letterSpacing = '0px';
}

// ── TEMPLATE FIT CHECK ──
function calcFreeZoneH(t) {
  const {D,s,y0,th} = gridGeom(t);
  if(t.type==='white') {
    return th - D/2;
  } else if(t.type==='blob') {
    // Top row is reserved for the badge — text only fills the grid below it.
    return (th - s) - D/2;
  } else {
    // pos=top: circles top-margin=MG, then grid, then GAP_CIRCLES_TEXT, then text zone, then BOTTOM_MG to canvas edge
    // pos=bottom: TOP_MG from canvas edge, then text zone, then GAP_CIRCLES_TEXT, then grid, then bottom-margin=MG
    if(t.pos==='top') return PH - BOTTOM_MG - (MG + th + GAP_CIRCLES_TEXT);
    else              return y0 - GAP_CIRCLES_TEXT - TOP_MG;
  }
}

function titleFitsInTemplate(t, titleText, hasSub) {
  if(t.type==='photo') return true; // no text at all in this format — never a fit concern
  const zH = calcFreeZoneH(t);
  let zW;
  if(t.type==='white' || t.type==='blob') {
    const D = calcD(t.c);
    const pad = D/4;
    const tw = D + STEP_R*(t.c-1)*D;
    zW = tw - pad*2;
  } else {
    zW = PW - MG*2;
  }
  if(zH <= 0 || zW <= 0) return false;
  // Blob headlines render in normal case (not uppercase) — measure what will actually draw.
  const txt = t.type==='blob' ? (titleText || fallbackTitle()) : (titleText || fallbackTitle()).toUpperCase();
  // try each size using visual metrics (same as drawTitleFree)
  const sizeLimit = t.type==='blob' ? blobSizeLimit(t) : T_SIZES.length-1;
  for(let i=0;i<=sizeLimit;i++){
    const sz=T_SIZES[i], ld=T_LEADING[i], tr=T_TRACK[i];
    const lines=wrapText(txt, zW, sz, tr);
    const fitsW=lines.every(l=>measureT(l,tr,sz)<=zW);
    if(!fitsW) continue;
    const sLines=hasSub ? wrapText(state.subheading||'',zW,S_SIZE,S_TRACK) : [];
    const m=textBlockMetrics(lines,sz,ld,tr,hasSub?sLines:null);
    if(m.h<=zH){
      // Reject layouts that would leave too much empty space between the circle
      // composition and the text. This is the largest size that fits (what gets
      // rendered), so a smaller size would only widen the gap — no need to keep trying.
      if(t.type!=='white' && t.type!=='blob'){
        const {th}=gridGeom(t);
        const gapDist = GAP_CIRCLES_TEXT + (zH - m.h); // empty distance between the bubble image and the text
        if(gapDist >= 0.5 * th) return false;
      }
      return true;
    }
  }
  return false;
}

// Pairs that exist in both grey and grey-d
function templateAllowed(t) {
  if(t.type === 'white' && t.r >= 2) return false;
  if(t.type === 'grey-d') return false; // grey-d no longer used
  return true;
}

function checkTemplateFit() {
  const hasSub=state.showSubheading;
  const needsRc=state.showTopic||state.showDate;
  const allowed=(t)=>templateAllowed(t) && (!needsRc||t.rc);
  const cur=TMPLS[state.tmplIdx];
  if(allowed(cur) && titleFitsInTemplate(cur, state.title, hasSub)) return;
  for(let i=1;i<=TMPLS.length;i++){
    const idx=(state.tmplIdx+i)%TMPLS.length;
    const t=TMPLS[idx];
    if(allowed(t) && titleFitsInTemplate(t, state.title, hasSub)){
      state.tmplIdx=idx;
      updateBlobSection();
      return;
    }
  }
}

// override generateBtn to only cycle fitting templates
function getValidTemplates() {
  const hasSub=state.showSubheading;
  const needsRc=state.showTopic||state.showDate;
  return TMPLS.map((_,i)=>i).filter(i=>{
    const t=TMPLS[i];
    if(!templateAllowed(t)) return false;
    if(needsRc && !t.rc) return false;
    return titleFitsInTemplate(t, state.title, hasSub);
  });
}

function drawPost() {

  const t = TMPLS[state.tmplIdx];
  const col = PALETTE[state.colorIdx];
  const {D,s,x0,y0,tw,th} = gridGeom(t);
  ctx.clearRect(0,0,PW,PH);

  if(t.type==='white') {
    // photo fills entire frame
    drawImg(0, PH);
    // white blobs on top of photo
    ctx.save(); circlePath(t); ctx.fillStyle=BLOB_PALETTE[state.blobColorIdx].bg; ctx.fill(); ctx.restore();
    // text inside blobs
    const blobCol = BLOB_PALETTE[state.blobColorIdx]; drawTitleInBlobs(t, D, s, x0, y0, th, blobCol);

  } else if(t.type==='blob') {
    // No photo: flat bg color, colored circles on top, headline inside them.
    // Top row is reserved for the badge (see calcFreeZoneH/drawRedCircle).
    // instagramText (Part-Editor-Modal-Corrections §7) is single-color: the
    // background and the circle grid (including its gap fills) share the
    // SAME PALETTE entry as the outer background, instead of an independent
    // BLOB_PALETTE[state.blobColorIdx] — the badge stays its own red accent,
    // untouched. Other blob-type formats (e.g. facebookText) keep the
    // original two-tone bg/circle behavior.
    const singleColorBlob = activePlatform && activePlatform.id === 'instagramText';
    const blobCol = singleColorBlob ? col : BLOB_PALETTE[state.blobColorIdx];
    ctx.fillStyle=col.bg; ctx.fillRect(0,0,PW,PH);
    ctx.save(); circlePath(t); ctx.fillStyle=blobCol.bg; ctx.fill(); ctx.restore();
    // This format has no diamond gaps at all — fill the interior corners between
    // circles with the same blob color so the grid reads as one continuous shape.
    fillBlobGapSquares(t, D, s, x0, y0, blobCol.bg);
    drawTitleInBlobs(t, D, s, x0, y0, th, blobCol, {reserveTopRow:true, upperCase:false});

  } else {
    // grey/grey-d/photo: solid bg everywhere, photo clipped inside circle shapes.
    // 'photo' (recognition formats) is the same rendering minus the text at the end.
    ctx.fillStyle=col.bg; ctx.fillRect(0,0,PW,PH);
    // draw photo clipped to circle mask — pass tw so cover fills the blob area
    ctx.save();
    circlePath(t);
    ctx.clip();
    drawImg(y0, th, tw);
    ctx.restore();
    // Fill gaps between circles with bg color (covers geometric gap artifacts)
    // Draw bg color OVER entire canvas, then re-draw circles as clip
    // Use "destination-in" trick: draw bg rect with composite to fill only gaps
    ctx.save();
    ctx.fillStyle = col.bg;
    // Fill bounding rect, then subtract circles = fills only the gaps
    ctx.fillRect(x0, y0, tw, th);
    ctx.globalCompositeOperation = 'destination-out';
    circlePath(t);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
    // Re-draw the photo inside circles (on top of gap fill)
    ctx.save();
    circlePath(t);
    ctx.clip();
    drawImg(y0, th, tw);
    ctx.restore();
    // Diamond gaps = the bg-colored diamonds between circles. They exist by default;
    // drawDiamonds() FILLS them with the photo, so it runs when the toggle is OFF.
    if(!state.showDiamonds && t.r>=2 && t.c>=2) drawDiamonds(t,D,s,x0,y0,col,th,tw);
    // text in free zone — recognition formats (type:'photo') have no text at all
    if(t.type!=='photo') drawTitleFree(t, th, y0, col);
  }

  // red circle
  if((state.showTopic||state.showDate) && t.rc) drawRedCircle(t,D,s,x0,y0);
}

function capHeight(sz) {
  // actualBoundingBoxAscent of 'H' = true cap height (excludes space above caps)
  ctx.font='500 '+sz+'px NocturneSans';
  return ctx.measureText('H').actualBoundingBoxAscent;
}

function fontDescent(sz) {
  ctx.font='500 '+sz+'px NocturneSans';
  const m = ctx.measureText('H');
  return m.fontBoundingBoxDescent || m.actualBoundingBoxDescent;
}

function textBlockMetrics(titleLines, sz, ld, tr, subLinesArr) {
  // Vertical trim: cap height top → baseline bottom (descH=0)
  // Descenders (ę, j, y...) hang below but don't affect block height
  const capH = capHeight(sz);
  const descH = 0; // trim to baseline
  let h = capH + (titleLines.length-1)*ld;
  // +0 for descent: block ends at baseline of last line
  let subCapH=0, subDescH=0;
  if(subLinesArr && subLinesArr.length){
    subCapH = capHeight(S_SIZE);
    subDescH = 0;
    h += 30 + subCapH + (subLinesArr.length-1)*S_LEAD;
  }
  return {h, capH, descH, subCapH, subDescH};
}

function drawTitleFree(t, th, y0, col) {
  const zW = PW - MG*2;
  const zH = calcFreeZoneH(t);
  const title = (state.title||fallbackTitle()).toUpperCase();
  const hasSub = state.showSubheading;

  // Pick best fitting size using SAME visual-metric height as drawing
  let bi = T_SIZES.length - 1;
  let chosenLines=[], chosenSubLines=[], chosenMetrics=null;
  for(let i=0;i<T_SIZES.length;i++){
    const sz=T_SIZES[i], ld=T_LEADING[i], tr=T_TRACK[i];
    const lines=wrapText(title,zW,sz,tr);
    const fitsW=lines.every(l=>measureT(l,tr,sz)<=zW);
    if(!fitsW) continue;
    const sLines=hasSub ? wrapText(state.subheading,zW,S_SIZE,S_TRACK) : [];
    const m=textBlockMetrics(lines,sz,ld,tr,hasSub?sLines:null);
    if(m.h<=zH){bi=i; chosenLines=lines; chosenSubLines=sLines; chosenMetrics=m; break;}
  }
  // Fallback: use smallest size
  if(!chosenMetrics){
    const sz=T_SIZES[bi], ld=T_LEADING[bi], tr=T_TRACK[bi];
    chosenLines=wrapText(title,zW,sz,tr);
    chosenSubLines=hasSub ? wrapText(state.subheading,zW,S_SIZE,S_TRACK) : [];
    chosenMetrics=textBlockMetrics(chosenLines,sz,ld,T_TRACK[bi],hasSub?chosenSubLines:null);
  }

  const sz=T_SIZES[bi], ld=T_LEADING[bi], tr=T_TRACK[bi];
  const {h:textBlockH, capH, descH, subCapH, subDescH} = chosenMetrics;

  // Anchor:
  // pos=top  → text group bottom = PH-MG → firstBaseline = PH-MG - textBlockH + capH
  // pos=bottom → text group top = MG    → firstBaseline = MG + capH
  // pos=top: circles top, text at bottom → BOTTOM_MG from bottom edge
  // pos=bottom: circles bottom, text at top → TOP_MG from top edge
  const firstBaseline = t.pos==='top'
    ? PH - BOTTOM_MG - textBlockH + capH
    : TOP_MG + capH;

  ctx.save(); ctx.fillStyle=col.text; ctx.textBaseline='alphabetic';
  ctx.font='500 '+sz+'px NocturneSans';
  let y = firstBaseline;
  for(let ti=0;ti<chosenLines.length;ti++){
    fillT(chosenLines[ti],MG,y,tr,sz);
    if(ti<chosenLines.length-1) y+=ld;
  }
  // y = last title baseline

  if(hasSub && chosenSubLines.length){
    y += descH + TITLE_SUB_GAP + subCapH;
    ctx.font='500 '+S_SIZE+'px NocturneSans';
    ctx.fillStyle=col.text;
    for(let si=0;si<chosenSubLines.length;si++){
      fillT(chosenSubLines[si],MG,y,S_TRACK,S_SIZE);
      if(si<chosenSubLines.length-1) y+=S_LEAD;
    }
  }
  ctx.restore();
}

function drawTitleInBlobs(t, D, s, x0, y0, th, col, opts) {
  opts = opts || {};
  const pad=D/4;
  const tw=D+STEP_R*(t.c-1)*D; // total width of blob grid
  // reserveTopRow: the badge sits in the top row, so text starts one row down
  const rowsY = opts.reserveTopRow ? y0+s : y0;
  const rowsH = opts.reserveTopRow ? th-s : th;
  const tX=x0+pad, tW=tw-pad*2, tY=rowsY+pad, tH=rowsH-pad*2;
  const title = opts.upperCase===false ? (state.title||fallbackTitle()) : (state.title||fallbackTitle()).toUpperCase();
  const sizeLimit = blobSizeLimit(t);
  let bi=null;
  for(let i=0;i<=sizeLimit;i++){
    const sz=T_SIZES[i], ld=T_LEADING[i], tr=T_TRACK[i];
    const lines=wrapText(title,tW,sz,tr);
    // Check height AND that no line overflows width
    const fitsH = lines.length*ld <= tH;
    const fitsW = lines.every(l => measureT(l,tr,sz) <= tW);
    if(fitsH && fitsW){bi=i;break;}
  }
  if(bi===null){
    // Nothing in this composition's allowed range fits — titleFitsInTemplate should
    // already have rejected it, so this only happens via buildFilmstrip's "nothing
    // fits anywhere" fallback, which force-renders template 0 regardless. Fall
    // through to the rest of the full ladder to minimize overflow instead of
    // rendering at the capped range's largest (and still too big) size.
    for(let i=sizeLimit+1;i<T_SIZES.length;i++){
      const sz=T_SIZES[i], ld=T_LEADING[i], tr=T_TRACK[i];
      const lines=wrapText(title,tW,sz,tr);
      const fitsH = lines.length*ld <= tH;
      const fitsW = lines.every(l => measureT(l,tr,sz) <= tW);
      if(fitsH && fitsW){bi=i;break;}
    }
    if(bi===null) bi = T_SIZES.length-1; // absolute smallest — may still not fully fit, but overflows the least
  }
  const sz=T_SIZES[bi], ld=T_LEADING[bi], tr=T_TRACK[bi];
  const lines=wrapText(title,tW,sz,tr);
  const capH  = capHeight(sz);
  // A fixed font-metric descent (not the actual last line's glyphs) so the bottom
  // padding reads the same whether or not that specific line has a descender (y,p,q,g…).
  const descH = fontDescent(sz);
  let y;
  if(opts.reserveTopRow){
    // Bottom-anchored: the block's bottom edge sits at the padded zone's bottom
    // regardless of line count, instead of floating in the middle for short text.
    y = tY + tH - descH - (lines.length-1)*ld;
  } else {
    // Center by full font em square (capH top + fontDescent bottom) for visual balance
    const visualH = capH + (lines.length-1)*ld + descH;
    y = tY + (tH - visualH)/2 + capH;
  }
  ctx.save(); ctx.fillStyle=col.text; ctx.textBaseline='alphabetic';
  for(const l of lines){ fillT(l,tX,y,tr,sz); y+=ld; }
  ctx.restore();
}

// Solid-fills the interior gap squares between circles — used by the no-photo blob
// format, which has no diamonds toggle and never wants the bg color showing through.
function fillBlobGapSquares(t,D,s,x0,y0,fillColor) {
  if(t.c<2||t.r<2) return;
  const half = s/2;
  ctx.save();
  ctx.beginPath();
  for(let row=0;row<t.r-1;row++) for(let col_=0;col_<t.c-1;col_++){
    const cx=x0+D/2+col_*s+s/2, cy=y0+D/2+row*s+s/2;
    ctx.rect(cx-half, cy-half, half*2, half*2);
  }
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.restore();
}

function drawDiamonds(t,D,s,x0,y0,col,th,tw) {
  if(t.c<2||t.r<2) return;
  const half = s/2; // local square around each interior 4-circle intersection
  // Build ONE combined path covering all interior grid-intersection squares —
  // processing them together (instead of looping with separate clip contexts)
  // avoids anti-aliasing seams at the shared edges between adjacent cells.
  function localSquares() {
    ctx.beginPath();
    for(let row=0;row<t.r-1;row++) for(let col_=0;col_<t.c-1;col_++){
      const cx=x0+D/2+col_*s+s/2, cy=y0+D/2+row*s+s/2;
      ctx.rect(cx-half, cy-half, half*2, half*2);
    }
  }
  // 1) erase all local squares to real transparency in one pass
  ctx.save();
  ctx.globalCompositeOperation='destination-out';
  localSquares();
  ctx.fill();
  ctx.restore();
  // 2) restore bg+photo, but only where the circles actually cover it —
  //    whatever stays transparent after this is exactly the natural gap shapes.
  ctx.save();
  localSquares();
  ctx.clip();
  circlePath(t);
  ctx.clip();
  ctx.fillStyle = col.bg;
  ctx.fillRect(x0, y0, tw, th);
  drawImg(y0, th, tw);
  ctx.restore();
  // 3) fill the remaining transparent gaps with the photo itself —
  //    destination-over only paints where alpha is still 0, i.e. exactly the gaps,
  //    leaving the already-restored circle areas untouched.
  ctx.save();
  localSquares();
  ctx.clip();
  ctx.globalCompositeOperation='destination-over';
  drawImg(y0, th, tw);
  ctx.restore();
}

function drawRedCircle(t,D,s,x0,y0) {
  const {th} = gridGeom(t);
  const D4=calcD(4);
  let cx, cy, R, scale=1;
  if(t.type==='photo'){
    // Recognition-format badge (e.g. YouTube cover): replaces the first circle
    // outright — same center and same diameter as this composition's own circles,
    // not the fixed D4 reference other formats use. Text scales up to match.
    R = D/2;
    cx = x0 + R;
    cy = y0 + R;
    scale = D / BADGE_CALIBRATION_D;
  } else if(t.type==='white'){
    R = D4/2;
    cx = x0 + R;
    cy = t.pos==='top' ? PH - MG - R : MG + R;
  } else {
    // grey / blob / default: top-left corner, matching the original Canva templates.
    R = D4/2;
    cx = x0 + R;
    cy = y0 + R;
  }
  ctx.save();
  ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2);
  ctx.fillStyle='#E03211'; ctx.fill();

  // Blob format is the one exception where the badge text is always forced to caps.
  let topic = state.showTopic ? state.topic : '';
  let date  = state.showDate  ? state.date  : '';
  if(t.type==='blob'){ topic = topic.toUpperCase(); date = date.toUpperCase(); }
  const mode  = state.dateMode  || 'single';

  // Text area: 30px padding from circle edge on all sides (scaled with the badge
  // itself, so proportions match the reference design at any badge size).
  // At circle center (widest point): usable half-width = R - pad
  const pad = 30 * scale; // red circle's internal text padding — intentionally independent of MG
  const tW  = 2 * (R - pad);     // max text width (at center height)
  const tX  = cx - (R - pad);    // left edge
  const tCY = cy;

  // Font sizes per spec — may be reduced to fit tW. Scaled proportionally to the
  // badge's own size vs. the reference size these were calibrated against.
  const TR = -0.02;
  let sz=37*scale, ld=43*scale;
  if(topic && date)        { sz=30*scale; ld=35*scale; }
  else if(date && mode==='range')  { sz=45*scale; ld=52*scale; }
  else if(date && mode==='year')   { sz=83*scale; ld=85*scale; }
  else if(date && mode==='single') { sz=67*scale; ld=77*scale; }
  else if(topic){
    // Rubric only: 37/43 is the default, but a long rubric can wrap onto enough
    // lines to run past the circle's usable height — fall back to the same
    // compact 30/35 style already used when a rubric shares the circle with a
    // date, based on whether it actually fits at 37/43 (not a character count).
    const fitLines = wrapText(topic, tW, 37*scale, TR);
    const fitH = capHeight(37*scale) + (fitLines.length - 1) * 43*scale;
    if(fitH > tW) { sz = 30*scale; ld = 35*scale; } // tW doubles as the circle's usable vertical span
  }

  // Auto-scale for any part that can't wrap: date never has spaces, and topic
  // may also be a single unbreakable token (e.g. a hashtag) — wrapText can't
  // break either, so both need a shrink-to-fit pass, not just date.
  const parts = [date, topic].filter(Boolean);
  const unwrappable = parts.filter(p => !p.includes(' '));
  if(unwrappable.length){
    while(sz > 14*scale){
      ctx.font='500 '+sz+'px NocturneSans';
      const widest = Math.max(...unwrappable.map(p => measureT(p, TR, sz)));
      if(widest <= tW) break;
      sz = Math.floor(sz * 0.9);
      ld = Math.round(sz * 1.15);
    }
  }

  // Build lines with wrapText now that sz fits
  ctx.font='500 '+sz+'px NocturneSans';
  let allLines = [];
  for(const p of parts) allLines.push(...wrapText(p, tW, sz, TR));

  // Vertical trim: cap height → baseline
  const capH  = capHeight(sz);
  const totalH = capH + (allLines.length - 1) * ld;
  let y = tCY - totalH / 2 + capH;

  // Clip to circle before drawing (belt-and-suspenders)
  ctx.beginPath(); ctx.arc(cx, cy, R - pad*0.3, 0, Math.PI*2); ctx.clip();

  ctx.fillStyle='#fff'; ctx.textBaseline='alphabetic';
  for(let i=0;i<allLines.length;i++){
    fillT(allLines[i], tX, y, TR, sz);
    if(i < allLines.length-1) y += ld;
  }
  ctx.restore();
}



// ── DRAG ──
function clampOffset(){
  if(!state.image) return;
  const t=TMPLS[state.tmplIdx];
  const {tw,th,y0,x0}=gridGeom(t);
  let areaW, areaH, areaX, areaY;
  if(t.type==='white'){ areaW=PW; areaH=PH; areaX=0; areaY=0; }
  else { areaW=tw; areaH=th; areaX=x0; areaY=y0; }
  const img=state.image;
  const minSc=coverScale(img,areaW,areaH);
  const sc=Math.max(state.imgScale,minSc);
  const dw=img.width*sc, dh=img.height*sc;
  // Max offset: half the overflow on each side
  const maxX=(dw-areaW)/2, maxY=(dh-areaH)/2;
  state.offX=Math.max(-maxX,Math.min(maxX,state.offX));
  state.offY=Math.max(-maxY,Math.min(maxY,state.offY));
}

// The photo is draggable in adjust mode — grabbing the poster OR the exposed photo
// around it both move the one continuous image. Everything else (frame, circles,
// text) stays put. Listeners live on window so a fast drag never loses the pointer.
let drag=false, dx0=0, dy0=0, ox=0, oy=0;

function startPhotoDrag(e){
  if(!state.adjusting || !state.image) return;
  drag=true; dx0=e.clientX; dy0=e.clientY; ox=state.offX; oy=state.offY;
  canvas.classList.add('is-dragging');
  const layer=document.getElementById('adjustPhotoLayer'); if(layer) layer.classList.add('is-dragging');
  e.preventDefault();
}
function movePhotoDrag(e){
  if(!drag) return;
  state.offX = ox + (e.clientX-dx0)/SCALE;
  state.offY = oy + (e.clientY-dy0)/SCALE;
  state.imgScaleManual = true;
  clampOffset();
  drawPost();
  updateAdjustLayer();
  if(!state.hasDraggedPhoto && (Math.abs(e.clientX-dx0)>3 || Math.abs(e.clientY-dy0)>3)){
    state.hasDraggedPhoto = true;   // the hint has served its purpose
    hideDragHint();
  }
}
function endPhotoDrag(){
  drag=false;
  canvas.classList.remove('is-dragging');
  const layer=document.getElementById('adjustPhotoLayer'); if(layer) layer.classList.remove('is-dragging');
}
canvas.addEventListener('pointerdown', startPhotoDrag);
const _adjLayer = document.getElementById('adjustPhotoLayer');
if(_adjLayer) _adjLayer.addEventListener('pointerdown', startPhotoDrag);
window.addEventListener('pointermove', movePhotoDrag);
window.addEventListener('pointerup', endPhotoDrag);
window.addEventListener('pointercancel', endPhotoDrag);

// ── UI ──
// Part VII (NID_GENERATOR_COMBINED_CORRECTIONS.md) — the background/blob
// palettes render as 8 overlapping circles in this left-to-right visual
// order (Rust→Brick→Terra→Amber→Sand→PatynaL→Patyna→Teal), independent of
// PALETTE/BLOB_PALETTE's own array index — state.colorIdx/blobColorIdx,
// PALETTE_BLOB_PAIR and saved drafts all still address the ORIGINAL index
// (dataset.idx), so nothing about existing saved data changes, only the
// order these colors are drawn in.
const PALETTE_VISUAL_ORDER = [1,2,3,4,0,5,6,7];

// No permanent "active" outline any more (Part VII) — the chosen color only
// shows live on the post itself; a click gets a brief spring-back squish
// instead (see .palette-circle.is-pressed in style.css).
function renderColorPalette(containerId, colors, onPick){
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  PALETTE_VISUAL_ORDER.forEach(i=>{
    const col = colors[i];
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'palette-circle';
    sw.style.background = col.bg;
    sw.dataset.idx = i;
    if(col.bg==='#FFFFFF') sw.style.border='2px solid #444';
    sw.setAttribute('aria-label', col.name);
    sw.onclick = () => {
      sw.classList.remove('is-pressed'); void sw.offsetWidth; sw.classList.add('is-pressed');
      onPick(i);
    };
    el.appendChild(sw);
  });
}
// Facebook Announcement (the one remaining two-tone blob format — see
// PALETTE_BLOB_PAIR above) shares this exact same standard palette row
// instead of a separate control: every format's onPick sets colorIdx, and
// this one additionally sets the paired blobColorIdx at the same time.
// instagramText is untouched — its render path (drawPost()) reads its blob
// color straight from colorIdx regardless of blobColorIdx, so leaving
// blobColorIdx alone for it here is a no-op, not a behavior change.
renderColorPalette('palette', PALETTE, i => {
  state.colorIdx = i;
  if(activePlatform && activePlatform.id === 'facebookText') state.blobColorIdx = PALETTE_BLOB_PAIR[i];
  refreshGalleryColors();
});
renderColorPalette('blobPalette', BLOB_PALETTE, i => { state.blobColorIdx = i; refreshGalleryColors(); });

// The standard palette row is shared by every non-white format, so its
// accessible labels need to describe the paired circle color too whenever
// Facebook Announcement is the one currently using it; plain color names the
// rest of the time.
function updatePaletteLabels(){
  const isFacebookText = activePlatform && activePlatform.id === 'facebookText';
  document.querySelectorAll('#palette .palette-circle').forEach(sw=>{
    const i = Number(sw.dataset.idx);
    sw.setAttribute('aria-label', isFacebookText
      ? PALETTE[i].name + ' background with ' + BLOB_PALETTE[PALETTE_BLOB_PAIR[i]].name + ' circle'
      : PALETTE[i].name);
  });
}

function updateBlobSection(){
  const t=TMPLS[state.tmplIdx];
  const isWhite = t && t.type==='white';
  // white: photo fills the bg, so only the blob (circle) color is pickable.
  // Every other format — including both blob-type text formats,
  // facebookText and instagramText — now shows the same standard 8-circle
  // palette; only their onPick behavior differs (see renderColorPalette
  // call above and drawPost()'s singleColorBlob check).
  document.getElementById('bgColorSection').style.display   = !isWhite ? 'block' : 'none';
  document.getElementById('blobColorSection').style.display = isWhite ? 'block' : 'none';
  updatePaletteLabels();
}

// Photo-only controls (adjust/replace photo, diamond gaps) are meaningless for a
// no-photo platform like the Facebook announcement format, and vice versa for
// Edit text on a format with no editable text at all. FINAL_EDITOR_CORRECTIONS.md
// supersedes UI_SPEC.md §13's "show disabled" rule: an inapplicable action is
// removed from the panel outright (display:none), not grayed out, so it never
// reserves empty height. Photo actions and the diamond toggle hide together as
// one row each; Edit text hides on its own.
function updateFormatControls(){
  const noPhoto = activePlatform && !activePlatform.hasPhoto;
  const photoActionsRow = document.querySelector('#finalPage .panel-actions');
  const diamondRow = document.getElementById('diamondToggle');
  if(photoActionsRow) photoActionsRow.style.display = noPhoto ? 'none' : '';
  if(diamondRow) diamondRow.style.display = noPhoto ? 'none' : '';

  // Formats with no editable text at all (no headline AND no badge — e.g. FB Event
  // cover) have no Edit text button. YouTube cover has no headline either, but its
  // badge is still editable, so it keeps the button (see openEditModal) — the
  // check is by actual editability, not by platform name, per the correction.
  const editTextBtn = document.getElementById('editTextBtn');
  const noText = activePlatform && !activePlatform.hasTitle && !activePlatform.hasBadge;
  if(editTextBtn) editTextBtn.style.display = noText ? 'none' : '';
}



// ── DATES (one date / range / year) ──
// state.dateType drives the UI; state.dateMode feeds the canvas engine (drawRedCircle) sizing.
state.dateMode = 'single';
state.dateType = ''; // no format chosen until the user picks a card

function dval(id){ const el=document.getElementById(id); return el ? el.value.trim() : ''; }
function joinDate(d,m,y){ return [d,m,y].filter(Boolean).join('.'); }

// Compose {date, mode} from a field getter for a given type. Reused by the wizard and the edit modal.
function composeDate(type, g){
  if(!type || type==='none') return { date:'', mode:'single' };
  if(type==='year'){ return { date:g('year'), mode:'year' }; }
  if(type==='range'){
    const s=joinDate(g('sd'),g('sm'),g('sy'));
    const e=joinDate(g('ed'),g('em'),g('ey'));
    if(!s && !e) return { date:'', mode:'single' };
    let date;
    if(g('sm')===g('em') && g('sy')===g('ey') && g('sd') && g('ed')) date = joinDate(g('sd')+'–'+g('ed'), g('sm'), g('sy'));
    else if(s && e) date = s + '–' + e;
    else date = s || e;
    return { date, mode:'range' };
  }
  // single
  const d = joinDate(g('d'), g('m'), g('y'));
  const noDayMonth = !g('d') && !g('m') && g('y');
  return { date:d, mode: noDayMonth ? 'year' : 'single' };
}

// Canonical (wizard) date fields — the single source of truth for the design.
const WIZ_DATE_FIELDS = { d:'dSingleD', m:'dSingleM', y:'dSingleY',
                          sd:'dRSD', sm:'dRSM', sy:'dRSY', ed:'dRED', em:'dREM', ey:'dREY', year:'dYear' };
function wizDateGet(name){ return dval(WIZ_DATE_FIELDS[name]); }

function buildDateValue(){
  const r = composeDate(state.dateType, wizDateGet);
  state.date = r.date; state.dateMode = r.mode;
}

// Step 2 purpose cards per platform — the plain-language "what are you creating"
// options, in the order they should be offered. Each maps to one of the actual
// internal formats. Unlike the earlier content-first design, these are never
// filtered — the user hasn't entered any content yet at this point — Step 3's
// form is what actually enforces each format's required fields.
// Visual order per UI_SPEC.md §9 (Announcement, Post, Event cover — left to
// right on Facebook's 3-circle reference); Instagram mirrors it. LinkedIn/
// YouTube have only one purpose each, so order is moot for them.
const PLATFORM_PURPOSES = {
  facebook:  [ {id:'facebook',     label:'purposePost'},
               {id:'facebookText', label:'purposeAnnouncement'},
               {id:'fbEvent',      label:'purposeEventCover'} ],
  instagram: [ {id:'instagram',     label:'purposeRegularPost'},
               {id:'instagramText', label:'purposeAnnouncement'} ],
  linkedin:  [ {id:'linkedin', label:'purposeRegularPost'} ],
  youtube:   [ {id:'youtube', label:'purposeVideoThumbnail'} ],
};

// Hover fill + text color per purpose (UI_SPEC.md §9) — only Facebook's three
// were actually measured (Announcement/Post/Event cover); Instagram/LinkedIn
// reuse the same purpose-type color, YouTube's "Video thumbnail" has no
// Figma-supplied color at all so it falls back to the Post tan as a neutral
// default pending a real spec for that circle.
const PURPOSE_HOVER = {
  facebookText:  { bg:'#65BC99', text:'#fff' },
  instagramText: { bg:'#65BC99', text:'#fff' },
  facebook:      { bg:'#FBC47D', text:'#2E2A25' },
  instagram:     { bg:'#FBC47D', text:'#2E2A25' },
  linkedin:      { bg:'#FBC47D', text:'#2E2A25' },
  fbEvent:       { bg:'#EE6F40', text:'#2E2A25' },
  youtube:       { bg:'#FBC47D', text:'#2E2A25' },
};

// Visual order per UI_SPEC.md §8 (Instagram, LinkedIn, Facebook, YouTube) — the
// destinations/keys this drives (PLATFORM_PURPOSES, pickTarget) are unaffected
// by array order, so this is a pure display-order change.
const TARGET_PLATFORMS = ['instagram','linkedin','facebook','youtube'];
let pendingTargetKey = null;

// Step 1 — "Where are we publishing?": remembers the platform and moves to
// Step 2, which lists that platform's own publication types.
function pickTarget(targetKey){
  pendingTargetKey = targetKey;
  renderPurposeCards(targetKey);
  navTo('purpose');
}

// Step 2 — "What are you creating?": every publication type this platform has,
// full stop. Re-run on language switch to keep labels in sync.
//
// UI_SPEC.md §9 measures a 3-circle Facebook row (diameter 591.238px, centers
// 480.381px apart, overlapping by 110.857px) and says to reuse the same
// circle component at a reduced count for platforms with fewer purposes,
// rather than inventing a different layout. Overlap is produced with a
// negative margin on the flex row (width diameter, step = diameter - overlap)
// so the same safe-centering fallback used for the platform-icon row still
// works if a row of circles ever overflows a narrow viewport.
function renderPurposeCards(targetKey){
  targetKey = targetKey || pendingTargetKey;
  const wrap = document.getElementById('purposeCards');
  if(!wrap || !targetKey) return;
  const t = I18N[state.lang];
  wrap.innerHTML = '';
  (PLATFORM_PURPOSES[targetKey]||[]).forEach(c=>{
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'purpose-circle';
    const hover = PURPOSE_HOVER[c.id] || PURPOSE_HOVER.facebook;
    btn.style.setProperty('--hover-bg', hover.bg);
    btn.style.setProperty('--hover-text', hover.text);
    const label = document.createElement('span'); label.className = 'purpose-circle-label';
    label.textContent = uiText(t[c.label]);
    btn.appendChild(label);
    btn.onclick = () => selectPlatform(c.id);
    wrap.appendChild(btn);
  });
}

// Picking a purpose card is the action, not a selection to confirm — it activates
// that format's canvas/templates and moves straight into its own content form.
function selectPlatform(id){
  resetSavedVariants();
  setActivePlatform(id);
  renderFormPage();
  navTo('form');
}

// Re-run on every language switch to keep labels in sync.
// Gray resting icon + brand-color hover icon per platform (UI_SPEC.md §8).
// Facebook/Instagram/YouTube colors are recolors of the real exported gray
// path at a standard brand hex — not a Figma-supplied swatch like LinkedIn's
// (#2D64BC, confirmed from the actual hover frame) — pending designer sign-off.
const PLATFORM_ICONS = {
  instagram: { gray:'assets/icons/instagram-gray.svg', color:'assets/icons/instagram-color.svg' },
  linkedin:  { gray:'assets/icons/linkedin-gray.svg',  color:'assets/icons/linkedin-color.svg' },
  facebook:  { gray:'assets/icons/facebook-gray.svg',  color:'assets/icons/facebook-color.svg' },
  youtube:   { gray:'assets/icons/youtube-gray.svg',   color:'assets/icons/youtube-color.svg' },
};

function renderPlatformCards(){
  const wrap = document.getElementById('platformCards');
  if(!wrap) return;
  const t = I18N[state.lang];
  wrap.innerHTML = '';
  TARGET_PLATFORMS.forEach(key=>{
    const label = 'target'+key.charAt(0).toUpperCase()+key.slice(1);
    const icons = PLATFORM_ICONS[key];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'platform-icon-btn';
    const gray = document.createElement('img'); gray.className = 'icon-gray'; gray.alt = ''; gray.src = icons.gray;
    const color = document.createElement('img'); color.className = 'icon-color'; color.alt = ''; color.src = icons.color;
    const name = document.createElement('span'); name.className = 'icon-label'; name.textContent = uiText(t[label]);
    btn.append(gray, color, name);
    btn.onclick = () => pickTarget(key);
    wrap.appendChild(btn);
  });
}

// "Where else do we publish?" modal (REUSE_PLATFORM_MODAL.md) — lists every
// other unique platform, re-run on every language switch and every time the
// final screen is (re)reached since the active platform (and so which pills
// to exclude) can have changed. Same PLATFORMS/applyReuse this always used;
// only the pill markup and hover behavior are new.
const REUSE_HOVER_COLORS = ['#EE6F40', '#F6A673', '#FBC47D', '#65BC99'];
// One of the 4 colors at random on pointer/focus entry, held for that hover
// or focus session, restored to neutral on leave/blur — never re-picked
// mid-hover, so no flicker on mouse movement.
function bindReuseHover(el){
  const pick = () => { el.style.background = REUSE_HOVER_COLORS[Math.floor(Math.random()*REUSE_HOVER_COLORS.length)]; };
  const clear = () => { el.style.background = ''; };
  el.addEventListener('mouseenter', pick);
  el.addEventListener('mouseleave', clear);
  el.addEventListener('focus', pick);
  el.addEventListener('blur', clear);
}
function renderReuseOptions(){
  const wrap = document.getElementById('reuseOptions');
  if(!wrap || !activePlatform) return;
  const t = I18N[state.lang];
  wrap.innerHTML = '';
  PLATFORMS.forEach(p=>{
    if(p.id === activePlatform.id) return;
    const key = p.id.charAt(0).toUpperCase() + p.id.slice(1);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'reuse-modal-pill';
    btn.textContent = uiText(t['platform'+key+'Label']);
    btn.onclick = () => { closeReuseModal(); applyReuse(p.id); };
    bindReuseHover(btn);
    wrap.appendChild(btn);
  });
}
function openReuseModal(){
  renderReuseOptions();
  document.getElementById('reuseModal').style.display = 'flex';
}
function closeReuseModal(){ document.getElementById('reuseModal').style.display = 'none'; }
document.getElementById('reuseToggle').onclick = openReuseModal;
document.getElementById('reuseModalClose').onclick = closeReuseModal;
document.getElementById('reuseModal').onclick = (e)=>{ if(e.target.id==='reuseModal') closeReuseModal(); };
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && document.getElementById('reuseModal').style.display==='flex') closeReuseModal(); });

// Switch to another platform, carrying over every field that still makes sense —
// the user reviews and clicks through the new platform's questions instead of
// retyping them. Composition/color choices reset (setActivePlatform's own default),
// since those are specific to the format being left, not portable between formats.
function applyReuse(platformId){
  if(!activePlatform || platformId === activePlatform.id) return;
  resetSavedVariants();
  const prevTitle = state.title;
  const prevDateType = state.dateType;
  const prevDateFields = collectDateFields();
  const prevSubheading = state.subheading;
  const prevTopic = state.topic;
  const prevImage = state.image;

  setActivePlatform(platformId);
  // Only carry a field into fields the new platform can actually show — e.g. FB
  // Event cover has no badge concept at all (unlike YouTube's optional one), so
  // date/rubric must clear rather than silently disable every composition via
  // getValidTemplates' rc filter. Same idea for headline and subheading.
  const canBadge = activePlatform.kind !== 'recognition' || activePlatform.hasBadge;
  const p = v => (v!=null ? v : '');

  const titleEl = document.getElementById('titleInput');
  const newTitle = activePlatform.hasTitle ? p(prevTitle) : '';
  titleEl.value = newTitle; state.title = newTitle;
  updateCharLimitMsg('titleInput', 80);

  state.dateType = canBadge ? p(prevDateType) : '';
  Object.keys(prevDateFields).forEach(id=>{ const el=document.getElementById(id); if(el) el.value = canBadge ? prevDateFields[id] : ''; });
  if(state.dateType) buildDateValue(); else { state.date=''; state.dateMode='single'; }

  const newSubheading = activePlatform.hasSubheading ? p(prevSubheading) : '';
  document.getElementById('subheadingInput').value = newSubheading;
  state.subheading = newSubheading;

  const newTopic = canBadge ? p(prevTopic) : '';
  document.getElementById('topicInput').value = newTopic;
  state.topic = newTopic;
  updateCharLimitMsg('topicInput', 35);

  // Recompute these immediately rather than waiting for the new platform's own
  // questions to set them — a format that skips a step entirely (e.g. FB Event
  // cover skips every text step) would otherwise carry the stale flag straight
  // through to the final screen, corrupting its template/badge logic.
  state.showDate = !!state.date;
  state.showSubheading = !!(state.subheading && state.subheading.trim());
  state.showTopic = !!(state.topic && state.topic.trim());

  // The photo file carries over; its crop/zoom doesn't — each platform's circle
  // grid is a different shape, so re-cover from scratch rather than reuse offsets.
  state.image = prevImage;
  state.offX = 0; state.offY = 0; state.imgScale = 1; state.imgScaleManual = false;
  updateImgButtons();
  if(prevImage) document.getElementById('wizardPhotoPreviewImg').src = prevImage.src;

  // NID_Generator_Corrections.md: reuse is a shortcut straight to the new
  // platform's final editor, not a return trip through the form/details
  // steps — checkTemplateFit() picks a template that actually fits the
  // carried-over content before goToFinal() renders the preview, same as
  // the normal completeGeneration() → goToFinal() path does.
  navHistory.length = 0; navHistory.push('platform');
  checkTemplateFit();
  goToFinal();
}

// Digit-only + auto-advance. `live` inputs (wizard) update the canvas immediately; modal inputs don't until Generate again.
function wireDateInput(el, live){
  if(!el) return;
  el.oninput = ()=>{ el.value = el.value.replace(/\D/g,''); if(live){ buildDateValue(); drawPost(); } };
  el.onkeyup = ()=>{
    const cap = parseInt(el.getAttribute('maxlength'),10) || 2;
    if(el.value.length >= cap){
      // Segments are adjacent inputs now (no separator spans between them), so
      // the next field is simply the next sibling input — not two siblings on.
      let next = el.nextElementSibling;
      while(next && next.tagName !== 'INPUT') next = next.nextElementSibling;
      if(next) next.focus();
    }
  };
}
['dSingleD','dSingleM','dSingleY','dRSD','dRSM','dRSY','dRED','dREM','dREY','dYear'].forEach(id=>wireDateInput(document.getElementById(id), true));

// No permanent counter any more (NID_GENERATOR_COMBINED_CORRECTIONS.md Part
// I) — a "You've reached the N-character limit" message appears next to the
// field's own label only exactly at max, and disappears the instant a
// character is removed.
function limitInput(id, key, max) {
  const el = document.getElementById(id);
  const msgEl = document.getElementById(id+'LimitMsg');
  el.oninput = e => {
    let v = e.target.value;
    if(v.length > max) { v = v.slice(0, max); el.value = v; }
    state[key] = v;
    if(msgEl) msgEl.textContent = v.length >= max ? uiText(I18N[state.lang].charLimitReached(max)) : '';
    checkTemplateFit();
    drawPost();
  };
}
// A headline must carry at least two letters. Counting letters (not characters)
// keeps Polish diacritics working and rejects "1", "!!!" and a lone letter alike.
// Deliberately no "gibberish" detection: proper nouns and abbreviations would
// trip it, and a wrong rejection costs far more than a weak headline.
const MIN_TITLE_LETTERS = 2;
function letterCount(s){ return (String(s || '').match(/\p{L}/gu) || []).length; }
function headlineOk(s){ return letterCount(s) >= MIN_TITLE_LETTERS; }

limitInput('titleInput',   'title',   80);

// Buttons stay clickable — pressing one with invalid input flashes the field and
// shows a short hint, which reads clearer than a dead, disabled button.
function flashRequired(inputId, hintId, msg){
  const el   = document.getElementById(inputId);
  const hint = document.getElementById(hintId);
  if(!el || !hint) return;
  el.classList.remove('is-invalid');
  void el.offsetWidth; // restart the flash animation if it's already running
  el.classList.add('is-invalid');
  hint.textContent = uiText(msg);
  hint.classList.add('show');
  el.focus();
  clearTimeout(el._hintTimer);
  el._hintTimer = setTimeout(()=>{
    hint.classList.remove('show');
    el.classList.remove('is-invalid');
  }, 1800);
}

function headlineMessage(value){
  const t = I18N[state.lang];
  return (value && value.trim()) ? t.headlineTooShort : t.enterHeadline;
}

limitInput('topicInput',   'topic',   35);
limitInput('subheadingInput','subheading',300);

// ── WIZARD FLOW ──
// One question per screen. Each date format has its own form screen, reached
// straight from the format card — no selected state, no extra confirm step.
const WIZ_PAGES = ['platform','purpose','form','details'];
const PAGE_ID   = { platform:'platform', purpose:'purpose', form:'form', details:'details' };
// every field a date form requires, plus the message shown when one's missing
const DATE_FORM_FIELDS = { single:['dSingleD','dSingleM','dSingleY'],
                           range:['dRSD','dRSM','dRSY','dRED','dREM','dREY'],
                           year:['dYear'] };
const DATE_MSG  = { single:'enterFullDate', range:'enterBothDates', year:'enterYear' };
state.currentPage = 'platform';

// Back navigation: a simple history stack of visited wizard screens.
const navHistory = ['platform'];

// Wizard steps whose own screen (per Figma) supplies its own floating logo +
// language switch instead of the shared topbar bar — see .figma-chrome in
// style.css. Extended as each step gets its own UI_SPEC.md section.
const FIGMA_CHROME_PAGES = new Set(['platform', 'purpose', 'form', 'details']);

function goToPage(key){
  state.currentPage = key;
  document.getElementById('stepPages').style.display = 'flex';
  document.getElementById('finalPage').classList.remove('is-current');
  document.body.classList.toggle('figma-chrome', FIGMA_CHROME_PAGES.has(key));
  WIZ_PAGES.forEach(k=>{
    const el = document.getElementById('page-'+PAGE_ID[k]);
    if(el) el.classList.toggle('is-current', k===key);
  });
  // The very first navigation (out of the password gate) still needs the
  // gate's own page removed as part of this same swap — done here, not by
  // startWizard() beforehand, so it happens under the wipe's opaque cover
  // (or instantly together with the rest under reduced motion) instead of
  // one frame earlier, which left a blank flash while the cover was still
  // fading in. A no-op on every later call, since the gate is already gone.
  const gate = document.getElementById('page-gate');
  if(gate) gate.classList.remove('is-current');
}

// Forward navigation records history so Back can retrace the exact path taken.
function navTo(key){ navHistory.push(key); goToPage(key); }

function goBackNav(){
  if(navHistory.length > 1){ navHistory.pop(); goToPage(navHistory[navHistory.length-1]); }
}

// Does this platform show a date/rubric badge at all? Mirrors the same check
// applyReuse uses: every readable/text format has one; among the photo-only
// recognition formats, only the ones that opt into hasBadge (YouTube) do.
function platformCanBadge(p){ return p.kind !== 'recognition' || p.hasBadge; }

const reqTag = (el, kind) => {
  if(!el) return;
  const t = I18N[state.lang];
  el.className = 'field-req-tag ' + (kind==='required' ? 'required-tag' : kind==='oneof' ? 'oneof-tag' : 'optional-tag');
  el.textContent = uiText(kind==='required' ? t.requiredTag : kind==='oneof' ? t.oneOfTag : t.optionalTag);
};

// Step 3a ("Add your content", GENERATOR_CORRECTIONS.md §3) — Photo, Heading,
// Subheading only; date/rubric moved to Step 3b (renderDetailsPage). Every
// section exists in the DOM at all times; this just shows the ones the
// active platform actually uses and marks each visible field Required/Optional.
function renderFormPage(){
  const p = activePlatform;
  const t = I18N[state.lang];

  const photoSection = document.getElementById('formPhotoSection');
  if(photoSection) photoSection.style.display = p.hasPhoto ? '' : 'none';
  reqTag(document.getElementById('formPhotoReqTag'), p.hasPhoto && p.photoRequired===false ? 'optional' : 'required');

  const titleSection = document.getElementById('formTitleSection');
  if(titleSection) titleSection.style.display = p.hasTitle ? '' : 'none';
  reqTag(document.getElementById('formTitleReqTag'), 'required');

  const subSection = document.getElementById('formSubheadingSection');
  if(subSection) subSection.style.display = p.hasSubheading ? '' : 'none';

  // A format with no detail option at all (only Facebook event cover today)
  // skips Step B entirely — see submitContentStep() — so its button finishes
  // the post directly and should read "Generate a post", not "Next". Own
  // judgment call flagged in GENERATOR_CORRECTIONS.md §3 as unspecified.
  const nextBtn = document.getElementById('formNextBtn');
  if(nextBtn){
    const key = platformCanBadge(p) ? 'next' : 'generate';
    nextBtn.dataset.i18n = key;
    nextBtn.textContent = uiText(t[key]);
  }

  updateImgButtons();
}

// Step 3b ("Add more details if it needed", GENERATOR_CORRECTIONS.md §3) —
// the unified 8-pill date/rubric selector, unchanged from its original §10
// design, just on its own screen now. Re-run every time Step A's Next
// advances here (platform/content can have changed) and on a language switch.
function renderDetailsPage(){
  const p = activePlatform;

  const badgeHint = document.getElementById('formBadgeHint');
  if(badgeHint){ badgeHint.classList.remove('show'); badgeHint.textContent = ''; }

  renderFormBadgeOptions();
  const hasDate = !!state.dateType && !!state.date;
  const hasRubric = !!(state.topic && state.topic.trim());
  const initialKey = (hasDate || hasRubric)
    ? modalBadgeKeyFor(hasDate ? state.dateType : '', hasRubric)
    : (p.badgeRequired ? 'rubric' : 'none');
  setFormBadge(initialKey);
}

// The unified detail-pill selector (UI_SPEC.md §10) — one pill per date/rubric
// combination, sharing MODAL_BADGE_OPTIONS with the edit-text modal (§11)
// instead of a separate always-on rubric field plus a separate date-type row.
// Re-run on every renderFormPage() (platform can change badgeRequired) and on
// a language switch.
function renderFormBadgeOptions(){
  const wrap = document.getElementById('formBadgePills');
  if(!wrap || !activePlatform) return;
  const badgeReq = activePlatform.badgeRequired;
  const t = I18N[state.lang];
  wrap.innerHTML = '';
  MODAL_BADGE_OPTIONS.forEach(opt=>{
    if(opt.key==='none' && badgeReq) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pill-btn';
    btn.dataset.key = opt.key;
    btn.textContent = uiText(t[opt.label]);
    btn.onclick = () => setFormBadge(opt.key);
    wrap.appendChild(btn);
  });
}

// Part III (NID_GENERATOR_COMBINED_CORRECTIONS.md) — the date group's label
// and layout depend on whether the date combines with a category: standalone
// "One date"/"Year" show no label at all, while pairing with a category adds
// a "Date"/"Year" label above; standalone "Date range" stacks two From/To
// blocks, while "Category & Date range" shows two Start date/End date
// columns instead. Same shape reused in setModalBadge() below.
function applyDateGroupLayout(opt, ids){
  const t = I18N[state.lang];
  const dateLabeled = opt.dateType==='single' && opt.rubric;
  const yearLabeled = opt.dateType==='year'   && opt.rubric;
  document.getElementById(ids.dateLabelBlock).style.display = dateLabeled ? '' : 'none';
  document.getElementById(ids.yearLabelBlock).style.display = yearLabeled ? '' : 'none';
  // A visible label above the group replaces that group's own top margin with
  // the label's own (smaller) bottom margin — see .date-group--labeled in
  // style.css — so the two states don't just collapse to whichever is larger.
  document.getElementById(ids.groupSingle).classList.toggle('date-group--labeled', dateLabeled);
  document.getElementById(ids.groupYear).classList.toggle('date-group--labeled', yearLabeled);
  const rangeGroup = document.getElementById(ids.groupRange);
  rangeGroup.classList.toggle('date-group--range', opt.rubric);
  rangeGroup.classList.toggle('date-group--stack', !opt.rubric);
  document.getElementById(ids.rangeStartLabel).textContent = uiText(opt.rubric ? t.startDate : t.dateFrom);
  document.getElementById(ids.rangeEndLabel).textContent   = uiText(opt.rubric ? t.endDate   : t.dateTo);
}

function setFormBadge(key){
  const opt = MODAL_BADGE_OPTIONS.find(o=>o.key===key) || MODAL_BADGE_OPTIONS[0];
  state.dateType = opt.dateType;
  document.querySelectorAll('#formBadgePills .pill-btn').forEach(b=>b.classList.toggle('active', b.dataset.key===opt.key));
  document.getElementById('formGroupSingle').style.display = opt.dateType==='single' ? '' : 'none';
  document.getElementById('formGroupRange').style.display  = opt.dateType==='range'  ? '' : 'none';
  document.getElementById('formGroupYear').style.display   = opt.dateType==='year'   ? '' : 'none';
  document.getElementById('formRubricSection').style.display = opt.rubric ? '' : 'none';
  applyDateGroupLayout(opt, {
    dateLabelBlock: 'formDateLabelBlock', yearLabelBlock: 'formYearLabelBlock',
    groupSingle: 'formGroupSingle', groupYear: 'formGroupYear',
    groupRange: 'formGroupRange', rangeStartLabel: 'formRangeStartLabel', rangeEndLabel: 'formRangeEndLabel'
  });
  if(!opt.rubric){
    document.getElementById('topicInput').value = '';
    updateCharLimitMsg('topicInput', 35);
    state.topic = '';
  }
  buildDateValue();
  state.showDate = !!state.date;
  checkTemplateFit();
  drawPost();
}

// Step A's "Next" (GENERATOR_CORRECTIONS.md §3) — validates only the content
// fields Step A itself shows (photo/headline), keeps every entered value, and
// advances to Step B. Never generates the post directly. The one exception —
// a format with no applicable detail option at all (only Facebook event cover
// today, see platformCanBadge) — has nothing for Step B to show, so it skips
// straight to completeGeneration() instead of opening an empty details
// screen; the correction flagged this branch as unspecified and left it for
// designer review, so treat this as a deliberate but revisitable judgment
// call, not a settled design decision.
function submitContentStep(){
  const p = activePlatform;
  const t = I18N[state.lang];

  if(p.hasTitle && !headlineOk(state.title)){
    flashRequired('titleInput','titleHint', headlineMessage(state.title)); return;
  }

  if(p.hasPhoto && p.photoRequired!==false && !state.image){
    flashRequired('addBtn','photoHint', t.addPhotoFirst); return;
  }

  state.showSubheading = p.hasSubheading && !!(state.subheading && state.subheading.trim());

  if(!platformCanBadge(p)){
    completeGeneration();
    return;
  }
  renderDetailsPage();
  navTo('details');
}

// Step B's "Generate post" (GENERATOR_CORRECTIONS.md §3) — validates the
// selected detail fields and the format's existing badge requirement, then
// hands off to the design/layout gallery. Also called directly by
// submitContentStep() for the one format that skips Step B entirely.
function completeGeneration(){
  const p = activePlatform;
  const t = I18N[state.lang];

  const canBadge = platformCanBadge(p);
  if(canBadge && state.dateType){
    const ids = DATE_FORM_FIELDS[state.dateType] || [];
    const firstEmpty = ids.find(id => !dval(id));
    if(firstEmpty){ flashRequired(firstEmpty, 'formDateHint', t[DATE_MSG[state.dateType]]); return; }
  }
  // A platform with no badge at all (e.g. FB Event cover) hides the date
  // section, but a stale dateType/date-field value from a previously-visited
  // badge-capable format would otherwise survive into buildDateValue() here —
  // showTopic already guards the same way; showDate needs to match it, or a
  // leftover date silently fails every template's rc-filter (getValidTemplates
  // returns zero, and the generated-suggestions strip disappears entirely).
  if(!canBadge){ state.dateType = ''; state.date=''; state.dateMode='single'; }
  buildDateValue();
  state.showDate = canBadge && !!state.date;
  state.showTopic = canBadge && !!(state.topic && state.topic.trim());

  if(p.badgeRequired && !state.showDate && !state.showTopic){
    flashRequired('topicInput','formBadgeHint', t.badgeRequiredHint); return;
  }

  checkTemplateFit();
  goToFinal();
}


// ── DESIGN screen (final): layout gallery ──
function goToFinal(){
  state.currentPage = 'final';
  document.getElementById('stepPages').style.display = 'none';
  WIZ_PAGES.forEach(k=>{ const el=document.getElementById('page-'+PAGE_ID[k]); if(el) el.classList.remove('is-current'); });
  document.getElementById('finalPage').classList.add('is-current');
  document.body.classList.add('figma-chrome');
  updateBlobSection();
  updateFormatControls();
  updateDiamondToggleUI(); // sync the track/thumb to state.showDiamonds before the first visible frame — was left at its static HTML markup otherwise
  renderReuseOptions();
  setupCanvas();
  buildFilmstrip(true);
}

const FILMSTRIP_CAP = 24; // soft ceiling so an unusually permissive text combo doesn't render dozens of thumbnails

// Generated-design strip (right of the preview): with zero or one variant
// there's nothing to pick between, so the whole column hides — restores the
// app's original behavior, separate from the always-visible drafts grid.
// 4 full cards + half a 5th show at once (the reference "4.5-card window"
// computed on #finalPage — see applyEditorLayout()); the visible window
// itself shrinks to the ACTUAL content height when there are fewer variants
// than that, rather than always reserving the full 494px with empty space
// below. Pocket-sizing only lives here; edge-line visibility is derived
// separately from real scroll geometry by updatePocketEdges() (see below),
// since a lane can be sized to overflow yet still be scrolled to one end.
function updateVariantsColVisibility(){
  const col = document.getElementById('variantsCol');
  if(!col) return;
  const n = state.currentGalleryBatch ? state.currentGalleryBatch.length : 0;
  col.style.display = n > 1 ? '' : 'none';
  if(n <= 1){ col.classList.remove('show-top-edge','show-bottom-edge'); return; }
  const tileH = parseFloat(getComputedStyle(document.getElementById('finalPage')).getPropertyValue('--strip-tile-h')) || 102.5;
  const maxVisibleH = 4.5 * tileH + 4 * 8;
  const contentH = n * tileH + (n - 1) * 8;
  col.style.setProperty('--strip-visible-h', Math.min(maxVisibleH, contentH) + 'px');
}

// Two independent stationary lines (NID_Generator_Mini_Preview_Pocket_Scroll_
// States.md) driven by #filmstrip's actual measured scroll position, not by
// item count or a single overflow flag: bottom-only at the top of a long
// list, both while scrolled between the ends, top-only at the very end,
// neither when the content doesn't actually overflow. A small tolerance
// absorbs fractional/sub-pixel scroll positions.
const POCKET_EDGE_TOLERANCE = 1.5;
function updatePocketEdges(){
  const col = document.getElementById('variantsCol');
  const strip = document.getElementById('filmstrip');
  if(!col || !strip) return;
  const { scrollTop, clientHeight, scrollHeight } = strip;
  const overflows = scrollHeight - clientHeight > POCKET_EDGE_TOLERANCE;
  const atStart = scrollTop <= POCKET_EDGE_TOLERANCE;
  const atEnd = scrollTop + clientHeight >= scrollHeight - POCKET_EDGE_TOLERANCE;
  col.classList.toggle('show-bottom-edge', overflows && !atEnd);
  col.classList.toggle('show-top-edge', overflows && !atStart);
}
{ const strip = document.getElementById('filmstrip'); if(strip) strip.addEventListener('scroll', updatePocketEdges); }

function buildFilmstrip(resetSelection){
  const valid = getValidTemplates();
  state.currentGalleryBatch = valid.slice(0, FILMSTRIP_CAP);
  const strip = document.getElementById('filmstrip');
  updateVariantsColVisibility();
  if(valid.length === 0){
    // Edge case: nothing in TMPLS satisfies this text combination — fall back to template 0 so there's still a design to look at.
    strip.innerHTML = '';
    state.tmplIdx = 0;
    updateBlobSection();
    drawPost();
    updateCarouselArrows();
    updatePocketEdges();
    return;
  }
  if(resetSelection || !state.currentGalleryBatch.includes(state.tmplIdx)){
    state.tmplIdx = state.currentGalleryBatch[0];
  }
  renderFilmstrip();
}

// One column of real app-rendered thumbnails, no placeholders/captions/delete —
// this is a live suggestion list for the current content, not a user-managed
// collection (that's the drafts grid, see renderDrafts). Selecting one updates
// the big preview; the strip itself scrolls if it outgrows the available height.
function renderFilmstrip(){
  const strip = document.getElementById('filmstrip');
  // A color/Diamonds repaint rebuilds every thumbnail in place (same batch,
  // same order) and must leave the pocket exactly where the user left it —
  // capture and restore scrollTop across the innerHTML reset rather than
  // letting it silently snap back to 0.
  const prevScrollTop = strip.scrollTop;
  strip.innerHTML = '';
  // Every thumbnail uses the CURRENT color/diamonds settings — only the template/grid varies between them.
  const savedTmpl = state.tmplIdx;
  state.currentGalleryBatch.forEach(idx=>{
    state.tmplIdx = idx;
    drawPost();
    const item = document.createElement('div');
    item.className = 'gen-thumb';
    item.dataset.tmpl = idx;
    const thumb = document.createElement('canvas');
    thumb.width = 128; thumb.height = Math.round(128 * PH / PW);
    thumb.getContext('2d').drawImage(canvas, 0, 0, thumb.width, thumb.height);
    item.appendChild(thumb);
    item.onclick = () => selectVariant(idx);
    strip.appendChild(item);
  });
  state.tmplIdx = savedTmpl;
  drawPost(); // restore the big canvas to the actually-selected template after painting thumbnails over it
  strip.scrollTop = prevScrollTop; // clamps itself if the new content is shorter
  highlightSelectedCard();
  updateCarouselArrows();
  updatePocketEdges();
}

// Called whenever color or diamonds change — repaints the big canvas and every filmstrip thumbnail with the new setting
function refreshGalleryColors(){
  updateBlobSection();
  if(state.currentGalleryBatch && state.currentGalleryBatch.length){
    renderFilmstrip();
  } else {
    drawPost();
  }
}

function highlightSelectedCard(){
  document.querySelectorAll('.gen-thumb').forEach(c=>{
    c.classList.toggle('selected', Number(c.dataset.tmpl) === state.tmplIdx);
  });
}

// Intentional pocket scrolling for a user-driven selection change (click or
// prev/next) — separate from highlightSelectedCard()'s pure styling so a
// plain repaint never moves the strip. offsetTop/clientHeight are plain
// layout-box values, unaffected by .final-stage's transform:scale(), so no
// getBoundingClientRect scale compensation is needed (.variants-strip has
// position:relative specifically so offsetTop resolves against it, the
// scroll container, rather than the outer #variantsCol shell).
function scrollPocketToSelected(){
  const strip = document.getElementById('filmstrip');
  if(!strip) return;
  const item = strip.querySelector('.gen-thumb[data-tmpl="' + state.tmplIdx + '"]');
  if(!item) return;
  const maxScroll = strip.scrollHeight - strip.clientHeight;
  if(maxScroll <= 0) return;
  const target = item.offsetTop - (strip.clientHeight - item.offsetHeight) / 2;
  const clamped = Math.max(0, Math.min(maxScroll, target));
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  strip.scrollTo({ top: clamped, behavior: reduced ? 'auto' : 'smooth' });
}

function updateCarouselArrows(){
  const n = state.currentGalleryBatch ? state.currentGalleryBatch.length : 0;
  const off = state.adjusting || n < 2; // the design is held still while adjusting the photo
  const pv=document.getElementById('prevVariantBtn'); if(pv) pv.disabled = off;
  const nv=document.getElementById('nextVariantBtn'); if(nv) nv.disabled = off;
}

function selectVariant(idx){
  if(state.adjusting) return;
  state.tmplIdx = idx;
  // A different variant can have its own photo-area shape — re-cover from
  // scratch rather than carry over a now-stale zoom (see imgScaleManual).
  state.offX = 0; state.offY = 0; state.imgScale = 1; state.imgScaleManual = false;
  highlightSelectedCard();
  scrollPocketToSelected(); // user-driven pick — the pocket may need to bring it into view
  updateBlobSection();
  drawPost();
}

function stepVariant(dir){
  if(state.adjusting) return;
  const batch = state.currentGalleryBatch;
  if(!batch || batch.length < 2) return;
  const cur = batch.indexOf(state.tmplIdx);
  const next = batch[(cur + dir + batch.length) % batch.length];
  selectVariant(next);
}

{ const pv=document.getElementById('prevVariantBtn'); if(pv) pv.onclick = () => stepVariant(-1);
  const nv=document.getElementById('nextVariantBtn'); if(nv) nv.onclick = () => stepVariant(1); }



// ── Download filename: YYMMDD_titlewithoutspaces_version.png ──
// Color, subheading, date, and circle layout are all versions of the same title —
// only a different title starts a new series (version resets to 1). The counter is
// keyed on the exact headline text and persists forever, independent of date/session.
const PL_TRANSLIT = { 'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z',
                       'Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z' };
const TITLE_SLUG_MAXLEN = 40;
function slugifyTitle(title){
  let s = (title || '').replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ch => PL_TRANSLIT[ch] || ch);
  s = s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, TITLE_SLUG_MAXLEN);
  return s || 'post'; // fallback so the filename is never left with an empty segment
}

const DOWNLOAD_VERSIONS_KEY = 'nid_ig_download_versions_v1';
function nextDownloadVersion(title){
  let map = {};
  try { map = JSON.parse(localStorage.getItem(DOWNLOAD_VERSIONS_KEY)) || {}; } catch(e){ map = {}; }
  const key = (title || '').trim();
  const n = (map[key] || 0) + 1;
  map[key] = n;
  try { localStorage.setItem(DOWNLOAD_VERSIONS_KEY, JSON.stringify(map)); }
  catch(e){ console.warn('Could not persist the download version counter (quota or private mode):', e); }
  return n;
}

function buildDownloadFilename(title){
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth()+1).padStart(2,'0');
  const dd = String(now.getDate()).padStart(2,'0');
  const version = String(nextDownloadVersion(title)).padStart(3,'0');
  return `${yy}${mm}${dd}_${slugifyTitle(title)}_${version}.png`;
}

// ── "Download post" variant-selection modal (REUSE_PLATFORM_MODAL.md) ──
// Card 0 is always the exact live preview ("current"), selected by default;
// cards 1..N are the saved Variants drafts in their saved order — no
// placeholders, unlike the always-8-slot Variants grid itself.
let dlCards = [];
let dlSelection = new Set();

// The modal's defined interaction states only cover 2–8 cards (1 downloads
// directly — see openDownloadModal()); current + a full 8-slot Variants grid
// can technically reach 9, so cap here rather than leave that combination
// with no defined layout. "current" is always kept; only the oldest drafts
// past the cap are dropped from the DOWNLOAD LIST — the saved Variants grid
// itself is untouched.
function downloadCardList(){
  const cards = [{ key:'current', platformId: state.platformId, thumb: makeThumbDataURL() }];
  state.drafts.forEach(d => cards.push({ key:'draft:'+d.id, platformId: d.platformId, thumb: d.thumb, entry: d }));
  return cards.slice(0, 8);
}

// Full-quality PNG for the modal preview — reuses the same live canvas +
// full re-render pipeline as exportSelectedDownloads() itself, so the
// preview is generated from the actual design/saved state at native canvas
// resolution (well over the "≥2× CSS size" floor) rather than the small
// 128px JPEG shortlist thumbnail, which stays as-is for the Variants grid.
async function buildModalPreview(card){
  if(card.key === 'current') return canvas.toDataURL('image/png');
  await applyEntryStateForExport(card.entry);
  setupCanvas();
  drawPost();
  return canvas.toDataURL('image/png');
}

async function openDownloadModal(){
  dlCards = downloadCardList();
  // A single downloadable design has nothing to choose between — skip the
  // modal and download it directly, at the existing full-resolution/filename
  // logic (exportSelectedDownloads() already does exactly that for 'current').
  if(dlCards.length <= 1){
    dlSelection = new Set(['current']);
    exportSelectedDownloads();
    return;
  }
  dlSelection = new Set(['current']);

  // Rendering each draft's high-res preview reuses the live canvas/state —
  // snapshot and restore around it, same pattern as exportSelectedDownloads().
  const snap = {
    platformId: state.platformId,
    title: state.title, date: state.date, topic: state.topic, subheading: state.subheading,
    showDate: state.showDate, showTopic: state.showTopic, showSubheading: state.showSubheading,
    dateMode: state.dateMode, dateType: state.dateType,
    colorIdx: state.colorIdx, blobColorIdx: state.blobColorIdx, tmplIdx: state.tmplIdx,
    showDiamonds: state.showDiamonds, offX: state.offX, offY: state.offY, imgScale: state.imgScale,
    image: state.image,
  };
  for(const c of dlCards){ c.previewSrc = await buildModalPreview(c); }
  setActivePlatform(snap.platformId);
  Object.assign(state, snap);
  setupCanvas();
  drawPost();

  renderDownloadCards();
  document.getElementById('downloadModal').style.display = 'flex';
}
function closeDownloadModal(){ document.getElementById('downloadModal').style.display = 'none'; }
document.getElementById('saveBtn').onclick = openDownloadModal;
document.getElementById('downloadModalClose').onclick = closeDownloadModal;
document.getElementById('downloadModal').onclick = (e)=>{ if(e.target.id==='downloadModal') closeDownloadModal(); };
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && document.getElementById('downloadModal').style.display==='flex') closeDownloadModal(); });

function updateDownloadActionButton(){
  const btn = document.getElementById('downloadSelectedBtn');
  if(!btn) return;
  const n = dlSelection.size;
  btn.disabled = n===0;
  btn.textContent = uiText(I18N[state.lang].downloadCount(n));
}

// Deliberate row groupings per count (NID_Generator_Corrections.md) — not
// generic flex-wrap, which would break rows purely on measured card widths
// and not match these specific Figma states. 2 cards use the separate large-
// card layout entirely (see renderDownloadCards()), so it has no entry here.
const DL_ROW_SPLITS = { 8:[4,4], 7:[4,3], 6:[3,3], 5:[3,2], 4:[2,2], 3:[2,1] };

// Cards render as toggle buttons — clicking anywhere on a card (not just the
// check badge) selects/deselects it; selection never touches the big preview,
// the drafts list, or any saved design (REUSE_PLATFORM_MODAL.md §Contents).
function renderDownloadCards(){
  const wrap = document.getElementById('downloadCards');
  if(!wrap) return;
  wrap.innerHTML = '';
  const n = dlCards.length;
  const large = n === 2; // the one count with its own bigger card size (324px vs 200px)
  const cardW = large ? 324 : 200;

  const makeCard = c => {
    const p = PLATFORMS.find(x=>x.id===c.platformId) || activePlatform;
    const ratio = p.canvas.h / p.canvas.w;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dl-card';
    btn.style.width = cardW + 'px';
    btn.style.height = Math.round(cardW*ratio) + 'px';
    const selected = dlSelection.has(c.key);
    btn.classList.toggle('selected', selected);
    btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
    const img = document.createElement('img'); img.src = c.previewSrc || c.thumb; img.alt = '';
    btn.appendChild(img);
    const badge = document.createElement('span'); badge.className = 'dl-check'; badge.setAttribute('aria-hidden','true');
    badge.innerHTML = '<svg width="11" height="8" viewBox="0 0 11 8"><path d="M1 4L4 7L10 1" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    btn.appendChild(badge);
    btn.onclick = () => {
      if(dlSelection.has(c.key)) dlSelection.delete(c.key); else dlSelection.add(c.key);
      renderDownloadCards();
    };
    return btn;
  };

  const rowSizes = large ? [2] : (DL_ROW_SPLITS[n] || [n]);
  let i = 0;
  rowSizes.forEach(size=>{
    const row = document.createElement('div');
    row.className = 'dl-row' + (large ? ' dl-row--large' : '');
    dlCards.slice(i, i+size).forEach(c => row.appendChild(makeCard(c)));
    i += size;
    wrap.appendChild(row);
  });

  updateDownloadActionButton();
}

// Applies one saved draft's design fields (not its DOM inputs, storage, or
// navigation — this is a rendering-only restore) so the shared canvas/state
// can be reused to export it, mirroring applyEntry()'s own field list.
function applyEntryStateForExport(d){
  setActivePlatform(d.platformId || 'instagram');
  state.title=d.title; state.date=d.date; state.topic=d.topic; state.subheading=d.subheading;
  state.showDate=d.showDate; state.showTopic=d.showTopic; state.showSubheading=d.showSubheading;
  state.dateMode=d.dateMode; state.dateType=d.dateType || '';
  state.colorIdx=d.colorIdx; state.blobColorIdx=d.blobColorIdx; state.tmplIdx=d.tmplIdx;
  state.showDiamonds=d.showDiamonds;
  state.offX=d.offX; state.offY=d.offY; state.imgScale=d.imgScale;
  return new Promise(resolve=>{
    if(d.image){
      const img = new Image();
      img.onload = () => { state.image = img; resolve(); };
      img.src = d.image;
    } else { state.image = null; resolve(); }
  });
}

// Exports every selected card at its own platform's full native canvas
// resolution, then restores the live editor exactly as it was. The shared
// canvas is reused sequentially (drawPost() is tightly coupled to the one
// module-level canvas/state, not written to take a target) — this is safe
// because the whole operation happens behind the modal's own opaque backdrop,
// and every selected design is captured before the live state is ever touched
// (the "current" card, if selected, is always first — see downloadCardList).
async function exportSelectedDownloads(){
  const selected = dlCards.filter(c => dlSelection.has(c.key));
  if(!selected.length) return;
  const btn = document.getElementById('downloadSelectedBtn');
  btn.disabled = true;
  const t = I18N[state.lang];
  btn.textContent = uiText(t.downloadPreparing);

  const snap = {
    platformId: state.platformId,
    title: state.title, date: state.date, topic: state.topic, subheading: state.subheading,
    showDate: state.showDate, showTopic: state.showTopic, showSubheading: state.showSubheading,
    dateMode: state.dateMode, dateType: state.dateType,
    colorIdx: state.colorIdx, blobColorIdx: state.blobColorIdx, tmplIdx: state.tmplIdx,
    showDiamonds: state.showDiamonds, offX: state.offX, offY: state.offY, imgScale: state.imgScale,
    image: state.image,
  };

  const files = [];
  for(const c of selected){
    if(c.key !== 'current'){
      await applyEntryStateForExport(c.entry);
      setupCanvas();
      drawPost();
    }
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    const title = c.key==='current' ? snap.title : c.entry.title;
    files.push({ name: buildDownloadFilename(title), blob });
  }

  setActivePlatform(snap.platformId);
  Object.assign(state, snap);
  setupCanvas();
  drawPost();

  await deliverFiles(files);

  closeDownloadModal();
  updateDownloadActionButton();
}
document.getElementById('downloadSelectedBtn').onclick = exportSelectedDownloads;

// One file downloads directly; more than one is packaged into a single .zip
// (built locally — see buildZip below) rather than firing several sequential
// <a download> clicks, which browsers commonly throttle or block past the
// first couple when they're not each their own direct user gesture.
async function deliverFiles(files){
  if(files.length === 1){
    const url = URL.createObjectURL(files[0].blob);
    const a = document.createElement('a'); a.href = url; a.download = files[0].name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 4000);
    return;
  }
  const zipBlob = await buildZip(files);
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2), mm = String(now.getMonth()+1).padStart(2,'0'), dd = String(now.getDate()).padStart(2,'0');
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a'); a.href = url; a.download = `${yy}${mm}${dd}_${slugifyTitle(state.title)}_posts.zip`; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 4000);
}

// ── Minimal uncompressed (store-method) ZIP writer ──
// No build step/CDN in this app, so no third-party zip library; PNGs are
// already compressed, so "store" (no deflate) loses nothing meaningful.
// Standard local-file-header + central-directory + end-of-central-directory
// layout, openable by any OS's built-in unarchiver.
function crc32(bytes){
  let c, crc = 0xFFFFFFFF;
  for(let i=0;i<bytes.length;i++){
    c = (crc ^ bytes[i]) & 0xFF;
    for(let k=0;k<8;k++) c = (c & 1) ? (0xEDB88320 ^ (c>>>1)) : (c>>>1);
    crc = (crc>>>8) ^ c;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function dosDateTime(d){
  const time = ((d.getHours() & 0x1F) << 11) | ((d.getMinutes() & 0x3F) << 5) | ((d.getSeconds()>>1) & 0x1F);
  const date = (((d.getFullYear()-1980) & 0x7F) << 9) | (((d.getMonth()+1) & 0xF) << 5) | (d.getDate() & 0x1F);
  return {time, date};
}
async function buildZip(files){
  const encoder = new TextEncoder();
  const {time, date} = dosDateTime(new Date());
  const localParts = [], centralParts = [];
  let offset = 0;

  for(const f of files){
    const nameBytes = encoder.encode(f.name);
    const data = new Uint8Array(await f.blob.arrayBuffer());
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);
    localParts.push(new Uint8Array(local.buffer), nameBytes, data);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0, true);
    central.setUint16(10, 0, true);
    central.setUint16(12, time, true);
    central.setUint16(14, date, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, data.length, true);
    central.setUint32(24, data.length, true);
    central.setUint16(28, nameBytes.length, true);
    central.setUint16(30, 0, true);
    central.setUint16(32, 0, true);
    central.setUint16(34, 0, true);
    central.setUint16(36, 0, true);
    central.setUint32(38, 0, true);
    central.setUint32(42, offset, true);
    centralParts.push(new Uint8Array(central.buffer), nameBytes);

    offset += local.buffer.byteLength + nameBytes.length + data.length;
  }

  const centralSize = centralParts.reduce((n,p)=>n+p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(4, 0, true);
  end.setUint16(6, 0, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  end.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, new Uint8Array(end.buffer)], {type:'application/zip'});
}

function openFilePicker(){ document.getElementById('fileInput').click(); }
document.getElementById('addBtn').onclick     = openFilePicker;
document.getElementById('wizardPhotoPreview').onclick = openFilePicker;
document.getElementById('replaceImageBtn').onclick = openFilePicker;
document.getElementById('editTextBtn').onclick = openEditModal;

// Photo not added → dashed dropzone (button + drag/drop); photo added → the
// compact preview itself becomes the replace control, no separate button
// (ADD_YOUR_CONTENT_CORRECTIONS.md).
function updateImgButtons(){
  const dropzone = document.getElementById('photoDropzone');
  const preview = document.getElementById('wizardPhotoPreview');
  const frame = document.getElementById('wizardPhotoFrame');
  if(dropzone) dropzone.style.display = state.image ? 'none' : '';
  if(preview) preview.classList.toggle('show', !!state.image);
  if(frame) frame.classList.toggle('show', !!state.image);
}

// Shared by the file picker and drag-and-drop — both just hand over a File.
function loadPhotoFile(file){
  if(!file || !file.type.startsWith('image/')) return;
  const img=new Image();
  img.onload=()=>{
    state.image=img;
    state.offX=0; state.offY=0;
    // Compute cover scale so image fills the clip area
    state.imgScale=1; // will be overridden by drawImg cover logic
    state.imgScaleManual=false;
    updateImgButtons();
    document.getElementById('wizardPhotoPreviewImg').src = img.src;
    if(state.currentPage === 'final'){
      // photo swapped from the final page — thumbnails were built from the old photo, refresh them
      buildFilmstrip(false);
    } else {
      drawPost();
    }
  };
  img.src=URL.createObjectURL(file);
}

document.getElementById('fileInput').onchange=e=>{
  loadPhotoFile(e.target.files[0]);
};

// Drag-and-drop a photo straight onto the wizard's photo step, as an alternative
// to the "Choose a photo" button.
(function setupPhotoDropzone(){
  const zone = document.getElementById('photoDropzone');
  if(!zone) return;
  let dragDepth = 0; // tracks nested dragenter/dragleave across child elements
  zone.addEventListener('dragenter', e=>{
    e.preventDefault();
    dragDepth++;
    zone.classList.add('is-dragover');
  });
  zone.addEventListener('dragover', e=>{ e.preventDefault(); });
  zone.addEventListener('dragleave', e=>{
    e.preventDefault();
    dragDepth = Math.max(0, dragDepth-1);
    if(dragDepth===0) zone.classList.remove('is-dragover');
  });
  zone.addEventListener('drop', e=>{
    e.preventDefault();
    dragDepth = 0;
    zone.classList.remove('is-dragover');
    const file = e.dataTransfer?.files?.[0];
    loadPhotoFile(file);
  });
})();
// ── ADJUST PHOTO ──
// Cover is the floor: the image always fills the mask, keeps its aspect ratio, and
// clampOffset() stops it being dragged far enough to expose the background.
const ZOOM_MAX = 3; // deepest zoom, as a multiple of the cover scale

function currentPhotoArea(){
  const t = TMPLS[state.tmplIdx];
  const {tw,th} = gridGeom(t);
  return (t && t.type==='white') ? { w:PW, h:PH } : { w:tw, h:th };
}
function currentCoverScale(){
  if(!state.image) return 1;
  const a = currentPhotoArea();
  return coverScale(state.image, a.w, a.h);
}
function zoomToSlider(){
  const min = currentCoverScale();
  if(!min) return 0;
  return Math.round(Math.max(0, Math.min(1, (state.imgScale/min - 1) / (ZOOM_MAX - 1))) * 100);
}
function applyZoomFromSlider(v){
  state.imgScale = currentCoverScale() * (1 + (v/100) * (ZOOM_MAX - 1));
  state.imgScaleManual = true;
  clampOffset();
  drawPost();
  updateAdjustLayer();
}
function coverReset(){
  state.imgScale = currentCoverScale();  // back to the exact cover fit
  state.offX = 0; state.offY = 0;        // and centred
  state.imgScaleManual = false;          // Reset always forces Fill, treated as fresh again
  clampOffset();
  drawPost();
  updateAdjustLayer();
  const s = document.getElementById('zoomSlider'); if(s) s.value = 0;
}

// One continuous photo: the exposed image around the poster is the SAME photo, at the
// SAME scale and offset, as the crop inside the circles (matching drawImg exactly), so
// it lines up seamlessly. The poster canvas on top (85%) lets it show through the frame.
function updateAdjustLayer(){
  const layer = document.getElementById('adjustPhotoLayer');
  if(!layer || !state.adjusting || !state.image) return;
  const t = TMPLS[state.tmplIdx];
  const white = t && t.type==='white';
  const {y0, th, tw} = gridGeom(t);
  const areaW = white ? PW : tw;
  const areaH = white ? PH : th;
  const areaY = white ? 0  : y0;
  const sc = Math.max(state.imgScale, coverScale(state.image, areaW, areaH));
  const dw = state.image.width * sc, dh = state.image.height * sc;
  const dx = (PW - dw)/2 + state.offX;                 // horizontally centred in the frame, like drawImg
  const dy = areaY + (areaH - dh)/2 + state.offY;
  layer.style.left   = (dx * SCALE) + 'px';
  layer.style.top    = (dy * SCALE) + 'px';
  layer.style.width  = (dw * SCALE) + 'px';
  layer.style.height = (dh * SCALE) + 'px';
}

function showDragHint(){ const h=document.getElementById('dragHint'); if(h) h.classList.add('show'); }
function hideDragHint(){ const h=document.getElementById('dragHint'); if(h) h.classList.remove('show'); }

function enterAdjust(){
  if(!state.image) return;
  state.adjusting = true;
  // On <body> so the whole chrome (incl. the top bar, which is outside #finalPage) dims,
  // and so .final-canvas-wrap picks up its fixed 773px-tall full-screen sizing (Part V)
  // before setupCanvas() below measures it.
  document.body.classList.add('is-adjusting');
  // A fresh photo+area combo (never manually zoomed/dragged) always opens at
  // genuine Fill/Cover — never carries forward a stale imgScale left over
  // from a different area (see imgScaleManual). A previously-adjusted one
  // (or a restored draft) reopens exactly where it was left.
  if(!state.imgScaleManual){
    state.imgScale = currentCoverScale();
    state.offX = 0; state.offY = 0;
    clampOffset();
  }
  // .final-canvas-wrap's own box just changed size (small preview → fixed
  // 773px-tall stage), so the canvas needs re-measuring now, not on the next
  // window resize.
  setupCanvas();
  drawPost();
  const layer = document.getElementById('adjustPhotoLayer');
  const s = document.getElementById('zoomSlider'); if(s) s.value = zoomToSlider();
  updateCarouselArrows();
  // Reveal the full photograph, then let CSS fade it in (≈280ms transition)
  if(layer){
    if(layer.src !== state.image.src) layer.src = state.image.src;
    layer.style.display = 'block';
    updateAdjustLayer();
    void layer.offsetWidth;        // commit the starting opacity:0 before the class flips it to .42
  }
  if(!state.hasDraggedPhoto) showDragHint();
}

function exitAdjust(){
  state.adjusting = false;
  document.body.classList.remove('is-adjusting');
  // .final-canvas-wrap just shrank back to the small preview box.
  setupCanvas();
  drawPost();
  hideDragHint();
  const layer = document.getElementById('adjustPhotoLayer');
  if(layer) setTimeout(()=>{ if(!state.adjusting) layer.style.display='none'; }, 300); // after the fade-out
  updateCarouselArrows();
  renderFilmstrip(); // thumbnails should show the framing the user just chose
}

document.getElementById('adjustPhotoBtn').onclick = enterAdjust;
document.getElementById('adjustDone').onclick     = exitAdjust;
document.getElementById('adjustReset').onclick    = coverReset;
document.getElementById('zoomSlider').oninput     = e => applyZoomFromSlider(Number(e.target.value));

setupCanvas();
drawPost();
updateBlobSection();
// Wizard cards start at 30vh from the top of the window, so the fixed chrome above them is measured.
function syncHeaderHeight(){
  const top = document.querySelector('.topbar');
  const nav = document.querySelector('.theme-nav');
  const h = (top ? top.offsetHeight : 0) + (nav ? nav.offsetHeight : 0);
  document.documentElement.style.setProperty('--header-h', h + 'px');
}
syncHeaderHeight();

window.addEventListener('resize',()=>{setupCanvas();drawPost();syncHeaderHeight();updateAdjustLayer();updateVariantsColVisibility();updatePocketEdges();});


function updateDiamondToggleUI(){
  const onBtn = document.getElementById('diamondsOnBtn');
  const offBtn = document.getElementById('diamondsOffBtn');
  const track = document.getElementById('diamondToggle');
  if(onBtn) onBtn.classList.toggle('active', state.showDiamonds);
  if(offBtn) offBtn.classList.toggle('active', !state.showDiamonds);
  // Slides the shared thumb under the two buttons — see .diamond-toggle-thumb
  // in style.css. Reflects state.showDiamonds directly (not a click-driven
  // toggle), so rapid repeated clicks still settle on the actual final state.
  if(track) track.classList.toggle('is-on', state.showDiamonds);
}

function setDiamonds(on){
  state.showDiamonds = on;
  updateDiamondToggleUI();
  refreshGalleryColors();
}

// ── I18N ──
const I18N = {
  en: {
    appTitle: 'Social Media Post Generator',
    gateTitle: 'Enter the password to continue',
    gatePlaceholder: 'Password',
    gateWrong: 'Wrong password. Try again.',

    // Format · where are we publishing (Step 1)
    platformStepTitle: 'Where are we publishing?',
    targetFacebook: 'Facebook',
    targetInstagram: 'Instagram',
    targetLinkedin: 'LinkedIn',
    targetYoutube: 'YouTube',

    // Purpose · what are you creating (Step 2)
    purposeStepTitle: 'What are you creating?',
    purposePost: 'Post',
    purposeRegularPost: 'Regular post',
    purposeAnnouncement: 'Announcement',
    purposeEventCover: 'Event cover',
    purposeVideoThumbnail: 'Video thumbnail',
    platformInstagramLabel: 'Instagram post',
    platformFacebookLabel: 'Facebook post',
    platformFacebookTextLabel: 'Facebook text announcement',
    platformInstagramTextLabel: 'Instagram text announcement',
    platformFbEventLabel: 'Facebook event cover photo',
    platformYoutubeLabel: 'YouTube video cover',
    platformLinkedinLabel: 'LinkedIn post',

    // Content form, split into two steps (GENERATOR_CORRECTIONS.md §3)
    formStepTitle: 'Add your content',
    next: 'Next',
    // Copy exactly as supplied (typo included), pending a designer revision.
    detailsStepTitle: 'Add more details if it needed',
    postPhoto: 'Photo',
    requiredTag: 'Required',
    optionalTag: 'Optional',
    oneOfTag: 'One of these required',
    changePhotoLabel: 'Change photo',

    // Text · headline
    postTitle: 'Headline',
    titlePlaceholder: 'Old abbey of the Canons Regular',
    closeLabel: 'Close',
    homeLabel: 'Back to the start',
    enterHeadline: 'Enter a headline to continue.',
    headlineTooShort: 'Use at least two letters.',
    back: 'Back',
    // Shown next to the field's own label only once its own maxlength is hit,
    // in place of a permanent 0/N counter (NID_GENERATOR_COMBINED_CORRECTIONS.md
    // Part I) — one shared template, since only the number differs per field.
    charLimitReached: n => `You’ve reached the ${n}-character limit`,

    // Text · dates
    enterFullDate: 'Enter the full date.',
    enterBothDates: 'Enter the start and end dates.',
    enterYear: 'Enter the year.',
    yearPlaceholder: 'YYYY',
    mDateSingle: 'One date',
    mDateYear: 'Year only',
    startDate: 'Start date',
    endDate: 'End date',
    // Standalone "Date range" (no category) reads as From/To; paired with a
    // category it keeps Start date/End date — same fields, different labels.
    dateFrom: 'From',
    dateTo: 'To',

    // Text · subheading
    subheading: 'Subheading',
    subheadingPlaceholder: 'A talk with the channel’s creators',

    // Text · rubric (labelled "Category" in the UI — see NID_GENERATOR_COMBINED_CORRECTIONS.md)
    rubric: 'Category',
    rubricPlaceholder: 'European Archaeology Days',
    badgeRequiredHint: 'This format needs a date or a category — it can’t exist without the red badge.',

    // Badge selector (Edit text modal) — one pill per date/rubric combination
    badgeNone: 'No details',
    badgeRubricRange: 'Category & Date range',
    badgeRubricYear: 'Category & Year',
    badgeRubricDate: 'Category & Date',

    addPhotoFirst: 'Add a photo to continue.',
    addImage: 'Choose a photo',
    replaceImage: 'Replace photo',
    photoDropHint: 'or drag and drop a photo here',
    generate: 'Generate a post',

    // Design · style
    diamonds: 'Diamond gaps',
    diamondsOn: 'Diamonds',
    diamondsOff: 'Without diamonds',
    variantsHeading: 'Variants',
    blobColor: 'Blob color',
    adjustPhoto: 'Adjust photo',
    zoomLabel: 'Zoom',
    reset: 'Reset',
    done: 'Done',
    dragHint: 'Drag the photo to reposition it',
    editText: 'Edit text',
    reuseOffer: 'Make this for another platform?',
    reuseModalTitle: 'Where else do we publish?',

    // Design · drafts
    draftsFull: () => 'Variants full (' + MAX_DRAFTS + '/' + MAX_DRAFTS + ')',
    deleteDraft: 'Remove',
    untitled: 'Untitled',

    // date types (wizard + edit modal)
    dateSingle: 'One date',
    dateRange: 'Date range',
    dateYear: 'Year only',
    dateNone: 'No date',
    // design panel
    contentHeading: 'Content',
    contentNote: 'Change the words or swap the photo any time.',
    colorHeading: 'Color',
    colorNote: "Sets the post's background color.",
    diamondsNote: 'Add small diamond-shaped gaps between the circles.',
    generateAgain: 'Save',
    download: 'Download post',
    downloadHint: 'Export the finished file, ready to post.',
    downloadModalTitle: 'Which variants would you like to download?',
    downloadPreparing: 'Preparing…',
    downloadCount: n => n===1 ? 'Download 1 variant' : `Download ${n} variants`,
    saveDraft: 'Save variant',
    saveDraftHint: 'Save this variant to compare with others.',
    saveNote: 'Download the current design, or save it here to compare with other versions.',
    draftDuplicate: 'Already saved to variants',
  },
  pl: {
    appTitle: 'Generator postów do social mediów',
    gateTitle: 'Wpisz hasło, aby kontynuować',
    gatePlaceholder: 'Hasło',
    gateWrong: 'Nieprawidłowe hasło. Spróbuj ponownie.',

    // Format · gdzie publikujemy (Krok 1)
    platformStepTitle: 'Gdzie publikujemy?',
    targetFacebook: 'Facebook',
    targetInstagram: 'Instagram',
    targetLinkedin: 'LinkedIn',
    targetYoutube: 'YouTube',

    // Cel · co tworzysz (Krok 2)
    purposeStepTitle: 'Co tworzysz?',
    purposePost: 'Post',
    purposeRegularPost: 'Zwykły post',
    purposeAnnouncement: 'Zapowiedź',
    purposeEventCover: 'Okładka wydarzenia',
    purposeVideoThumbnail: 'Miniatura wideo',
    platformInstagramLabel: 'Post na Instagram',
    platformFacebookLabel: 'Post na Facebook',
    platformFacebookTextLabel: 'Zapowiedź tekstowa na Facebook',
    platformInstagramTextLabel: 'Zapowiedź tekstowa na Instagram',
    platformFbEventLabel: 'Zdjęcie na okładkę wydarzenia na Facebooku',
    platformYoutubeLabel: 'Okładka wideo YouTube',
    platformLinkedinLabel: 'Post na LinkedIn',

    // Formularz treści, podzielony na dwa kroki (GENERATOR_CORRECTIONS.md §3)
    formStepTitle: 'Dodaj treść',
    next: 'Dalej',
    detailsStepTitle: 'Dodaj więcej szczegółów, jeśli są potrzebne',
    postPhoto: 'Zdjęcie',
    requiredTag: 'Wymagane',
    optionalTag: 'Opcjonalne',
    oneOfTag: 'Wymagane jedno z tych pól',
    changePhotoLabel: 'Zmień zdjęcie',

    // Tekst · nagłówek
    postTitle: 'Nagłówek',
    titlePlaceholder: 'Dawne opactwo Kanoników Regularnych',
    closeLabel: 'Zamknij',
    homeLabel: 'Wróć na początek',
    enterHeadline: 'Dodaj nagłówek, aby kontynuować.',
    headlineTooShort: 'Użyj co najmniej dwóch liter.',
    back: 'Wstecz',
    charLimitReached: n => `Osiągnięto limit ${n} znaków`,

    // Tekst · daty
    enterFullDate: 'Wpisz pełną datę.',
    enterBothDates: 'Wpisz datę początkową i końcową.',
    enterYear: 'Wpisz rok.',
    yearPlaceholder: 'RRRR',
    mDateSingle: 'Pojedyncza data',
    mDateYear: 'Tylko rok',
    startDate: 'Data początkowa',
    endDate: 'Data końcowa',
    dateFrom: 'Od',
    dateTo: 'Do',

    // Tekst · podtytuł
    subheading: 'Podtytuł',
    subheadingPlaceholder: 'Rozmowa z twórcami kanału',

    // Tekst · rubryka
    rubric: 'Kategoria',
    rubricPlaceholder: 'Europejskie Dni Archeologii',
    badgeRequiredHint: 'Ten format wymaga daty lub kategorii — nie może istnieć bez czerwonego znacznika.',

    // Selektor plakietki (modal Edit text) — jedna pigułka na każdą kombinację
    badgeNone: 'Bez szczegółów',
    badgeRubricRange: 'Kategoria i zakres dat',
    badgeRubricYear: 'Kategoria i rok',
    badgeRubricDate: 'Kategoria i data',

    // Zdjęcie
    addPhotoFirst: 'Dodaj zdjęcie, aby kontynuować.',
    addImage: 'Dodaj zdjęcie',
    replaceImage: 'Zmień zdjęcie',
    photoDropHint: 'albo przeciągnij i upuść zdjęcie tutaj',
    generate: 'Stwórz post',

    // Projekt · styl
    diamonds: 'Romby',
    diamondsOn: 'Romby',
    diamondsOff: 'Bez rombów',
    variantsHeading: 'Warianty',
    blobColor: 'Kolor plamy',
    adjustPhoto: 'Dopasuj zdjęcie',
    zoomLabel: 'Powiększenie',
    reset: 'Zacznij od nowa',
    done: 'Gotowe',
    dragHint: 'Przeciągnij zdjęcie, aby zmienić kadr.',
    editText: 'Edytuj tekst',
    reuseOffer: 'Zrobić wersję na inną platformę?',
    reuseModalTitle: 'Gdzie jeszcze publikujemy?',

    // Projekt · wersje robocze
    draftsFull: () => 'Limit wersji (' + MAX_DRAFTS + '/' + MAX_DRAFTS + ')',
    deleteDraft: 'Usuń',
    untitled: 'Bez tytułu',

    // typy daty (wizard + modal edycji)
    dateSingle: 'Pojedyncza data',
    dateRange: 'Zakres dat',
    dateYear: 'Tylko rok',
    dateNone: 'Bez daty',
    // panel projektu
    contentHeading: 'Treść',
    contentNote: 'Zmień tekst lub podmień zdjęcie w każdej chwili.',
    colorHeading: 'Kolor',
    colorNote: 'Ustawia kolor tła posta.',
    diamondsNote: 'Dodaj małe romby między kołami.',
    generateAgain: 'Zapisz',
    download: 'Pobierz gotowy plik',
    downloadHint: 'Eksportuj gotowy plik, do opublikowania od razu.',
    downloadModalTitle: 'Które warianty chcesz pobrać?',
    downloadPreparing: 'Przygotowywanie…',
    downloadCount: n => {
      const mod10 = n % 10, mod100 = n % 100;
      const word = n === 1 ? 'wariant' : (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) ? 'warianty' : 'wariantów';
      return `Pobierz ${n} ${word}`;
    },
    saveDraft: 'Zapisz wariant',
    saveDraftHint: 'Zapisz ten wariant, aby porównać go z innymi.',
    saveNote: 'Pobierz bieżący projekt albo zapisz go tutaj, aby porównać z innymi wersjami.',
    draftDuplicate: 'Już zapisano w wariantach',
  },
};

// Typographic non-breaking spaces after short English words, so they never sit alone
// at the end of a line. Interface copy only — user-entered post text is drawn on the
// canvas and never passes through here.
const NBSP_AFTER_EN = /\b(a|an|the|and|or|in|of|on|to|for|with)\s+/gi;
// Short Polish prepositions/conjunctions that shouldn't hang alone at a line end
const NBSP_AFTER_PL = /\b(i|a|o|u|w|z|do|na|po|we|ze|od|ku|by|\u017Ce|to)\s+/gi;
function typo(s, lang){
  if(typeof s !== 'string') return s;
  const re = lang==='pl' ? NBSP_AFTER_PL : NBSP_AFTER_EN;
  return s.replace(re, (m, w) => w + '\u00A0');
}
function uiText(s){ return typo(s, state.lang); }

// Inputs whose placeholder is interface copy (not user content) and must be
// translated per language rather than left as static HTML.
function applyPlaceholders(lang){
  const t = I18N[lang];
  const one = (id, val) => { const el=document.getElementById(id); if(el) el.placeholder = val; };
  one('titleInput', t.titlePlaceholder);
  one('mTitle', t.titlePlaceholder);
  one('subheadingInput', t.subheadingPlaceholder);
  one('mSub', t.subheadingPlaceholder);
  one('topicInput', t.rubricPlaceholder);
  one('mRubric', t.rubricPlaceholder);
  ['dSingleY','dRSY','dREY','dYear','mSingleY','mRSY','mREY','mYear'].forEach(id => one(id, t.yearPlaceholder));
}

function applyLanguage(lang){
  state.lang = lang;
  try { localStorage.setItem('nid_ig_lang', lang); } catch(e){}
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.dataset.i18n;
    const val = I18N[lang][key];
    if(typeof val === 'string') el.textContent = typo(val, lang);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el=>{
    const key = el.dataset.i18nTitle;
    const val = I18N[lang][key];
    if(typeof val === 'string') el.title = typo(val, lang);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>{
    const key = el.dataset.i18nAria;
    const val = I18N[lang][key];
    if(typeof val === 'string') el.setAttribute('aria-label', typo(val, lang));
  });
  const gi = document.getElementById('gateInput'); if(gi) gi.placeholder = I18N[lang].gatePlaceholder;
  applyPlaceholders(lang);
  document.querySelectorAll('.brand-icon').forEach(img=>img.setAttribute('aria-label', I18N[lang].homeLabel));
  document.getElementById('langEn').classList.toggle('active', lang==='en');
  document.getElementById('langPl').classList.toggle('active', lang==='pl');
  // Move the shared indicator into the selected button here, in the base
  // non-animated path — not only inside motion.js's Flip wrapper — so a
  // restored PL session renders correctly on the very first frame (the
  // saved-language call on load runs before motion.js has installed its
  // wrapper) and the indicator is still correct with GSAP unavailable or
  // reduced motion requested. The wrapper captures Flip state before calling
  // this function and animates the move this line performs.
  const langIndicator = document.getElementById('langIndicator');
  const activeLangBtn = document.getElementById(lang==='en' ? 'langEn' : 'langPl');
  if(langIndicator && activeLangBtn && langIndicator.parentElement !== activeLangBtn) activeLangBtn.appendChild(langIndicator);
  // keep dynamic labels in sync with the chosen language
  renderDrafts();
  renderPlatformCards();
  renderReuseOptions();
  if(pendingTargetKey) renderPurposeCards();
  if(state.currentPage==='form') renderFormPage();
  if(state.currentPage==='details') renderDetailsPage();
  // The badge pill row is built from JS (8 language-dependent labels) rather than
  // static data-i18n markup, so it needs its own refresh if the modal is open.
  if(document.getElementById('editModal').style.display==='flex'){
    renderModalBadgeOptions(activePlatform.badgeRequired);
    setModalBadge(modalBadgeKey);
  }
  // The download modal's action button carries a live selection count in its
  // label, also built in JS rather than static markup.
  if(document.getElementById('downloadModal').style.display==='flex') updateDownloadActionButton();
}

document.querySelectorAll('.lang-btn').forEach(btn=>{
  btn.onclick = () => applyLanguage(btn.dataset.lang);
});
// ── DRAFTS (shortlist to compare) ──
// Scoped to the current format and creation run only (NID_Generator_Purpose_
// Variants_Gray_Proposal.md §4) — never persisted, so a reload or a format
// switch always starts from zero saved variants. DRAFTS_KEY is kept only to
// purge the legacy cross-reload copy old sessions may still have on disk.
const DRAFTS_KEY = 'nid_ig_drafts_v1';
const MAX_DRAFTS = 8; // exactly fills the 2-row × 4-col "Variants" grid

function loadStores(){
  state.drafts = [];
  try { localStorage.removeItem(DRAFTS_KEY); } catch(e){}
}

// Called on every new-format boundary (selectPlatform, applyReuse) — the
// saved-variants shortlist doesn't carry across formats or creation runs.
function resetSavedVariants(){
  state.drafts = [];
  renderDrafts();
}

function makeThumbDataURL(){
  const tmp = document.createElement('canvas');
  const w = 128, h = Math.round(128 * PH / PW);
  tmp.width = w; tmp.height = h;
  tmp.getContext('2d').drawImage(canvas, 0, 0, w, h);
  return tmp.toDataURL('image/jpeg', 0.82);
}

const DATE_FIELD_IDS = ['dSingleD','dSingleM','dSingleY','dRSD','dRSM','dRSY','dRED','dREM','dREY','dYear'];
function collectDateFields(){
  const out = {};
  DATE_FIELD_IDS.forEach(id=>{ const el=document.getElementById(id); out[id] = el ? el.value : ''; });
  return out;
}

function makeEntry(){
  const entry = {
    id: Date.now(),
    platformId: state.platformId,
    title: state.title, date: state.date, topic: state.topic, subheading: state.subheading,
    showDate: state.showDate, showTopic: state.showTopic, showSubheading: state.showSubheading,
    dateMode: state.dateMode, dateType: state.dateType, dateFields: collectDateFields(),
    colorIdx: state.colorIdx, blobColorIdx: state.blobColorIdx, tmplIdx: state.tmplIdx,
    showDiamonds: state.showDiamonds,
    offX: state.offX, offY: state.offY, imgScale: state.imgScale,
    image: null,
    thumb: makeThumbDataURL(),
  };
  if(state.image){
    const tmp = document.createElement('canvas');
    const maxDim = 1400;
    const scale = Math.min(1, maxDim / Math.max(state.image.width, state.image.height));
    tmp.width = Math.round(state.image.width * scale);
    tmp.height = Math.round(state.image.height * scale);
    tmp.getContext('2d').drawImage(state.image, 0, 0, tmp.width, tmp.height);
    entry.image = tmp.toDataURL('image/jpeg', 0.85);
  }
  return entry;
}

// The rendered thumbnail faithfully fingerprints the whole design (text + layout + color + photo),
// so identical designs make identical thumbs — used to block adding the same design twice.
function saveDraft(){
  if(state.drafts.length >= MAX_DRAFTS){ alert(I18N[state.lang].draftsFull()); return; }
  const entry = makeEntry();
  if(state.drafts.some(d => d.thumb === entry.thumb)){
    flashDraftBtn(I18N[state.lang].draftDuplicate);
    return;
  }
  state.drafts.push(entry);
  renderDrafts();
}

let _draftBtnTimer = null;
function flashDraftBtn(msg){
  const btn = document.getElementById('saveDraftBtn');
  if(!btn) return;
  btn.textContent = msg;
  clearTimeout(_draftBtnTimer);
  _draftBtnTimer = setTimeout(renderDrafts, 1600);
}

function removeDraft(i){
  state.drafts.splice(i,1);
  renderDrafts();
}

function loadDraft(i){ const d = state.drafts[i]; if(d) applyEntry(d); }

// Show the right date group + active button without redrawing (used when restoring a draft).

// Restore a draft onto the canvas and jump to the Design screen.
function applyEntry(d){
  // Drafts from different platforms share one list; switch canvas/TMPLS first so
  // tmplIdx below resolves against the array it was actually saved from.
  setActivePlatform(d.platformId || 'instagram');
  state.title=d.title; state.date=d.date; state.topic=d.topic; state.subheading=d.subheading;
  state.showDate=d.showDate; state.showTopic=d.showTopic; state.showSubheading=d.showSubheading;
  state.dateMode=d.dateMode; state.dateType=d.dateType || '';
  state.colorIdx=d.colorIdx; state.blobColorIdx=d.blobColorIdx; state.tmplIdx=d.tmplIdx;
  state.showDiamonds=d.showDiamonds;
  state.offX=d.offX; state.offY=d.offY; state.imgScale=d.imgScale;
  // A restored draft's own saved framing is meaningful, never "fresh" — Adjust
  // Photo should reopen exactly where the draft left it, not reset to Fill.
  state.imgScaleManual = true;

  const titleEl = document.getElementById('titleInput');
  titleEl.value = d.title || '';
  updateCharLimitMsg('titleInput', 80);

  document.getElementById('topicInput').value = d.topic || '';
  updateCharLimitMsg('topicInput', 35);
  document.getElementById('subheadingInput').value = d.subheading || '';
  updateCharLimitMsg('subheadingInput', 300);

  const df = d.dateFields || {};
  Object.keys(df).forEach(id=>{ const el=document.getElementById(id); if(el) el.value = df[id]; });

  updateDiamondToggleUI();

  updateBlobSection();
  updateFormatControls();
  renderReuseOptions();
  checkTemplateFit();

  document.getElementById('stepPages').style.display = 'none';
  WIZ_PAGES.forEach(k=>{ const el=document.getElementById('page-'+PAGE_ID[k]); if(el) el.classList.remove('is-current'); });
  document.getElementById('finalPage').classList.add('is-current');
  state.currentPage = 'final';
  setupCanvas();

  const finishRender = () => { updateImgButtons(); buildFilmstrip(false); drawPost(); };
  if(d.image){ const img = new Image(); img.onload = () => { state.image = img; finishRender(); }; img.src = d.image; }
  else { state.image = null; finishRender(); }
}

function renderDrafts(){
  const t = I18N[state.lang];
  const wrap = document.getElementById('draftsList');
  if(wrap){
    wrap.innerHTML = '';
    state.drafts.forEach((d,i)=>{
      const item = document.createElement('div');
      item.className = 'draft-tile';
      item.title = d.title || t.untitled;
      const img = document.createElement('img'); img.src = d.thumb; item.appendChild(img);
      item.onclick = () => loadDraft(i);
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'thumb-remove';
      del.textContent = '×';
      del.title = t.deleteDraft;
      del.onclick = (e) => { e.stopPropagation(); removeDraft(i); };
      item.appendChild(del);
      wrap.appendChild(item);
    });
    // Grid always reads as full capacity (UI_SPEC.md §13 "Left Variants grid")
    // — inert grey placeholders fill the remaining slots up to MAX_DRAFTS.
    for(let i = state.drafts.length; i < MAX_DRAFTS; i++){
      const ph = document.createElement('div');
      ph.className = 'draft-placeholder';
      ph.setAttribute('aria-hidden', 'true');
      wrap.appendChild(ph);
    }
  }
  const full = state.drafts.length >= MAX_DRAFTS;
  const draftBtn = document.getElementById('saveDraftBtn');
  if(draftBtn){
    draftBtn.disabled = full;
    draftBtn.textContent = t.saveDraft;
  }
}

document.getElementById('saveDraftBtn').onclick = saveDraft;

// ── EDIT-TEXT MODAL (flat form: headline / subheading / rubric / date type) ──
const MODAL_DATE_FIELDS = { d:'mSingleD', m:'mSingleM', y:'mSingleY',
                            sd:'mRSD', sm:'mRSM', sy:'mRSY', ed:'mRED', em:'mREM', ey:'mREY', year:'mYear' };

// The badge selector (Figma Components/Filter Toolbar): one pill per date/rubric
// combination, instead of a date-type row plus a separately-toggled rubric field.
// Each pill fully determines both modalDateType and modalRubricOn.
const MODAL_BADGE_OPTIONS = [
  { key:'none',          dateType:'',       rubric:false, label:'badgeNone' },
  { key:'single',        dateType:'single', rubric:false, label:'mDateSingle' },
  { key:'range',         dateType:'range',  rubric:false, label:'dateRange' },
  { key:'year',          dateType:'year',   rubric:false, label:'mDateYear' },
  { key:'rubric',        dateType:'',       rubric:true,  label:'rubric' },
  { key:'rubric-range',  dateType:'range',  rubric:true,  label:'badgeRubricRange' },
  { key:'rubric-year',   dateType:'year',   rubric:true,  label:'badgeRubricYear' },
  { key:'rubric-single', dateType:'single', rubric:true,  label:'badgeRubricDate' },
];
let modalDateType = '';
let modalRubricOn = false;
let modalBadgeKey = 'none';

function modalBadgeKeyFor(dateType, rubricOn){
  const dt = dateType || '';
  const opt = MODAL_BADGE_OPTIONS.find(o => o.dateType===dt && o.rubric===rubricOn);
  return opt ? opt.key : 'none';
}

// Rebuilt on every openEditModal() (badgeReq can differ per platform) and on a
// language switch while the modal happens to be open.
function renderModalBadgeOptions(badgeReq){
  const wrap = document.getElementById('mDateType');
  if(!wrap) return;
  const t = I18N[state.lang];
  wrap.innerHTML = '';
  MODAL_BADGE_OPTIONS.forEach(opt=>{
    // Badge-required formats can't drop to neither a date nor a rubric — the
    // "No details" pill simply isn't offered, same as the old mDateNoneBtn hiding.
    if(opt.key==='none' && badgeReq) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pill-btn';
    btn.dataset.key = opt.key;
    btn.textContent = uiText(t[opt.label]);
    btn.onclick = () => setModalBadge(opt.key);
    wrap.appendChild(btn);
  });
}

function setModalBadge(key){
  const opt = MODAL_BADGE_OPTIONS.find(o=>o.key===key) || MODAL_BADGE_OPTIONS[0];
  modalBadgeKey = opt.key;
  modalDateType = opt.dateType;
  modalRubricOn = opt.rubric;
  document.querySelectorAll('#mDateType .pill-btn').forEach(b=>b.classList.toggle('active', b.dataset.key===key));
  document.getElementById('mGroupSingle').style.display = modalDateType==='single' ? '' : 'none';
  document.getElementById('mGroupRange').style.display  = modalDateType==='range'  ? '' : 'none';
  document.getElementById('mGroupYear').style.display   = modalDateType==='year'   ? '' : 'none';
  document.getElementById('mRubricBlock').style.display = modalRubricOn ? '' : 'none';
  document.getElementById('mDateType').classList.toggle('has-category-gap', modalRubricOn);
  applyDateGroupLayout(opt, {
    dateLabelBlock: 'mDateLabelBlock', yearLabelBlock: 'mYearLabelBlock',
    groupSingle: 'mGroupSingle', groupYear: 'mGroupYear',
    groupRange: 'mGroupRange', rangeStartLabel: 'mRangeStartLabel', rangeEndLabel: 'mRangeEndLabel'
  });
  if(!modalRubricOn){ document.getElementById('mRubric').value = ''; updateCharLimitMsg('mRubric', 35); }
}
['mSingleD','mSingleM','mSingleY','mRSD','mRSM','mRSY','mRED','mREM','mREY','mYear'].forEach(id=>wireDateInput(document.getElementById(id), false));

function updateCharLimitMsg(id, max){
  const el = document.getElementById(id);
  const msgEl = document.getElementById(id+'LimitMsg');
  if(!el || !msgEl) return;
  msgEl.textContent = el.value.length >= max ? uiText(I18N[state.lang].charLimitReached(max)) : '';
}

// Modal fields don't touch canonical state until Save (openFilePicker's own
// commit happens in mGenerateBtn's handler), so this is a lighter version of
// limitInput() — same char-limit-message behavior, no state/canvas side effects.
const MODAL_CHAR_LIMITS = { mTitle: 80, mSub: 300, mRubric: 35 };
Object.keys(MODAL_CHAR_LIMITS).forEach(id=>{
  const max = MODAL_CHAR_LIMITS[id];
  const el = document.getElementById(id);
  if(!el) return;
  el.setAttribute('maxlength', max);
  el.oninput = () => {
    if(el.value.length > max) el.value = el.value.slice(0, max);
    updateCharLimitMsg(id, max);
  };
});

function copyFields(map, fromCanonical){
  Object.keys(map).forEach(name=>{
    const canonId = WIZ_DATE_FIELDS[name], modalId = MODAL_DATE_FIELDS[name];
    const from = document.getElementById(fromCanonical ? canonId : modalId);
    const to   = document.getElementById(fromCanonical ? modalId : canonId);
    if(from && to) to.value = from.value;
  });
}

function openEditModal(){
  document.getElementById('mTitle').value  = state.title || '';
  const badgeReq = activePlatform.badgeRequired;
  // Formats with no headline at all (recognition path, e.g. YouTube cover) hide the
  // whole Required section instead of trying to satisfy it with an empty field.
  const hasTitle = activePlatform.hasTitle;
  document.getElementById('mRequiredSection').style.display = hasTitle ? '' : 'none';
  document.getElementById('mSubBlock').style.display = activePlatform.hasSubheading ? '' : 'none';
  document.getElementById('mSub').value    = state.showSubheading ? (state.subheading||'') : '';
  document.getElementById('mRubric').value = state.showTopic ? (state.topic||'') : '';
  Object.keys(MODAL_CHAR_LIMITS).forEach(id=>updateCharLimitMsg(id, MODAL_CHAR_LIMITS[id]));
  copyFields(MODAL_DATE_FIELDS, true); // canonical → modal

  renderModalBadgeOptions(badgeReq);
  const hasDate = state.showDate && !!state.dateType;
  const hasRubric = state.showTopic && !!(state.topic && state.topic.trim());
  const initialKey = (hasDate || hasRubric)
    ? modalBadgeKeyFor(hasDate ? state.dateType : '', hasRubric)
    : (badgeReq ? 'rubric' : 'none');
  // display:flex BEFORE setModalBadge() — motion.js's Flip wrapper around
  // setModalBadge() needs the modal actually laid out to capture a real
  // "before" state; calling it while the modal is still display:none (its
  // previous state) captured a degenerate 0×0 box and could leave #mDateType
  // stuck with inline width:0;height:0 from GSAP's own before/after snapshot.
  document.getElementById('editModal').style.display = 'flex';
  setModalBadge(initialKey);
  setTimeout(()=>document.getElementById('mTitle').focus(), 50);
}
function closeEditModal(){ document.getElementById('editModal').style.display = 'none'; }
document.getElementById('modalClose').onclick = closeEditModal;
document.getElementById('editModal').onclick = (e)=>{ if(e.target.id==='editModal') closeEditModal(); };
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && document.getElementById('editModal').style.display==='flex') closeEditModal(); });

document.getElementById('mGenerateBtn').onclick = ()=>{
  // Same headline rule as the wizard, so the modal can't be used to bypass it —
  // except formats with no headline at all (the Required section is hidden for them).
  const mTitleVal = document.getElementById('mTitle').value;
  if(activePlatform.hasTitle && !headlineOk(mTitleVal)){ flashRequired('mTitle','mTitleHint', headlineMessage(mTitleVal)); return; }

  // Snapshot the fields this handler is about to overwrite, so a rejected save
  // (badge-required guard below) can roll the canonical state back to what's
  // still actually on screen behind the modal, instead of leaving it half-applied.
  const _prevTopic=state.topic, _prevShowTopic=state.showTopic, _prevTopicInputVal=document.getElementById('topicInput').value;
  const _prevDate=state.date, _prevDateMode=state.dateMode, _prevDateType=state.dateType, _prevShowDate=state.showDate;
  const _prevDateFieldVals = collectDateFields();

  // Write modal values into the canonical inputs + state, then regenerate.
  const setInput = (id,val)=>{ const el=document.getElementById(id); el.value=val; el.dispatchEvent(new Event('input',{bubbles:true})); };
  setInput('titleInput', mTitleVal);
  if(activePlatform.hasSubheading){
    const sub = document.getElementById('mSub').value;
    setInput('subheadingInput', sub); state.showSubheading = !!(sub && sub.trim());
  }
  const rub = modalRubricOn ? document.getElementById('mRubric').value : '';
  setInput('topicInput', rub); state.showTopic = !!(rub && rub.trim());

  copyFields(MODAL_DATE_FIELDS, false); // modal → canonical
  const noDate = !modalDateType;
  state.dateType = noDate ? '' : modalDateType;
  if(noDate){
    DATE_FIELD_IDS.forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    state.date=''; state.dateMode='single'; state.showDate=false;
  } else {
    buildDateValue();
    state.showDate = !!state.date;
  }

  // Formats whose badge is mandatory (e.g. Facebook announcement) can't be edited
  // down to neither a date nor a rubric — same rule the wizard enforces on the way in.
  // With "No details" hidden for these formats, this only fires when a pill was
  // picked but its own field(s) were left empty (e.g. "One date" with blank inputs).
  if(activePlatform.badgeRequired && !state.showDate && !state.showTopic){
    state.topic=_prevTopic; state.showTopic=_prevShowTopic;
    state.date=_prevDate; state.dateMode=_prevDateMode; state.dateType=_prevDateType; state.showDate=_prevShowDate;
    document.getElementById('topicInput').value = _prevTopicInputVal;
    updateCharLimitMsg('topicInput', 35);
    Object.keys(_prevDateFieldVals).forEach(id=>{ const el=document.getElementById(id); if(el) el.value=_prevDateFieldVals[id]; });
    if(modalDateType){
      const ids = { single:['mSingleD','mSingleM','mSingleY'], range:['mRSD','mRSM','mRSY','mRED','mREM','mREY'], year:['mYear'] }[modalDateType] || [];
      flashRequired(ids[0] || 'mRubric', 'mRubricHint', I18N[state.lang].badgeRequiredHint);
    } else {
      flashRequired('mRubric','mRubricHint', I18N[state.lang].badgeRequiredHint);
    }
    return;
  }

  checkTemplateFit();
  closeEditModal();
  buildFilmstrip(true);
  drawPost();
};

loadStores();
(function initLang(){
  let saved = 'en';
  try { saved = localStorage.getItem('nid_ig_lang') || 'en'; } catch(e){}
  applyLanguage(saved);
})();

// ── INTRO: password gate → wizard ──
// NOTE: this is a light client-side deterrent, NOT real security. The password is
// present in the JavaScript sent to every visitor and can be read or bypassed in
// the browser. It only keeps casual visitors from wandering in.
// Part VI (NID_GENERATOR_COMBINED_CORRECTIONS.md) replaced the old rectangular
// field + Continue button with nine overlapping circles that fill in as the
// (invisible) real #gateInput is typed into, and removed the separate
// "Create a social media post / Start" screen — a correct password now
// advances straight to the platform picker.
const GATE_PASSWORD = 'NIDstart9';
const GATE_KEY = 'nid_ig_unlocked';
const GATE_COLORS = ['#E03211','#AA1F08','#EE6F40','#F6A673','#FBC47D','#FFF3E7','#CBE3C4','#65BC99','#0B6B6C'];

function renderGateCircles(){
  const wrap = document.getElementById('gateCircles');
  wrap.innerHTML = '';
  for(let i=0;i<GATE_PASSWORD.length;i++){
    const c = document.createElement('div');
    c.className = 'gate-circle';
    wrap.appendChild(c);
  }
}

function updateGateCircles(){
  const val = document.getElementById('gateInput').value;
  document.querySelectorAll('#gateCircles .gate-circle').forEach((c,i)=>{
    c.style.background = i < val.length ? GATE_COLORS[i] : '';
  });
}

// Guards the success sequence below against re-entry (repeated input events,
// paste, fast typing) and lets showGate() cleanly reset a run that never
// finished (see there).
let gateCompleting = false;
let gateSuccessTimer = null;

function showGate(){
  document.getElementById('stepPages').style.display = 'flex';
  document.getElementById('finalPage').classList.remove('is-current');
  document.body.classList.add('figma-chrome'); // own floating logo + red lang pill, like the platform/purpose pickers
  WIZ_PAGES.forEach(k=>{ const el=document.getElementById('page-'+PAGE_ID[k]); if(el) el.classList.remove('is-current'); });
  document.getElementById('page-gate').classList.add('is-current');
  const el = document.getElementById('gateInput');
  // Reset any success run left over from an interrupted previous pass —
  // guard, timer, read-only lock, and the composition's own transform.
  gateCompleting = false;
  clearTimeout(gateSuccessTimer);
  el.readOnly = false;
  const composition = document.getElementById('gateComposition');
  if(typeof gsap !== 'undefined'){ gsap.killTweensOf(composition); gsap.set(composition, { clearProps: 'transform' }); }
  else if(composition) composition.style.transform = '';
  el.value = '';
  renderGateCircles();
  updateGateCircles();
  setTimeout(()=>el.focus(), 150);
}

// Runs once, only after the exact 9-character password has matched: hold the
// fully-colored nine-circle row on screen long enough to register, give the
// whole title+circles composition one quiet compress/release, then unlock
// and navigate — never before the acknowledgment finishes, and never twice
// (NID_Generator_Save_Arc_And_Password_Completion.md §2).
function runGateSuccess(){
  if(gateCompleting) return;
  gateCompleting = true;
  const el = document.getElementById('gateInput');
  el.readOnly = true; // belt-and-suspenders alongside the gateCompleting guard: no mid-flight edits

  const finishAndNavigate = () => {
    try { sessionStorage.setItem(GATE_KEY, '1'); } catch(e){}
    startWizard();
  };

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const composition = document.getElementById('gateComposition');
  if(typeof gsap === 'undefined' || !composition){
    // No animation library (or no composition wrapper, which shouldn't
    // happen) — a correct password must still advance regardless.
    gateSuccessTimer = setTimeout(finishAndNavigate, 260);
    return;
  }
  if(reduced){
    // Let the complete nine-circle row register briefly, then go straight
    // through — no scale motion.
    gateSuccessTimer = setTimeout(finishAndNavigate, 260);
    return;
  }
  gsap.timeline({ delay: 0.55, onComplete: finishAndNavigate }) // ~350–450ms hold after the last circle's own ~150ms color transition
    .to(composition, { scale: 0.965, duration: 0.2, ease: 'power2.out' })
    .to(composition, { scale: 1, duration: 0.16, ease: 'power2.out' });
}

// Runs on every keystroke (typed, backspaced, or pasted) — the 9-char cap
// (maxlength) plus this length check is the whole "submit": no separate
// button, matching Part VI's auto-advance-on-9th-character requirement.
function submitGate(){
  if(gateCompleting) return; // a successful run is already in flight
  const el = document.getElementById('gateInput');
  updateGateCircles();
  if(el.value.length < GATE_PASSWORD.length) return;
  if(el.value === GATE_PASSWORD){
    runGateSuccess();
  } else {
    flashRequired('gateInput', 'gateHint', I18N[state.lang].gateWrong);
    el.value = '';
    updateGateCircles();
  }
}
document.getElementById('gateInput').addEventListener('input', submitGate);

function startWizard(){
  // page-gate's own is-current is removed by goToPage() itself, as part of
  // the same swap as the destination page — not here, beforehand, which
  // used to leave a blank frame visible while withWipe()'s cover was still
  // fading in.
  pendingTargetKey = null;
  navHistory.length = 0; navHistory.push('platform');   // where to publish is the first real step
  goToPage('platform');
}

// The NID mark doubles as a "back to the start" shortcut: from any wizard step
// or the final editor it returns to the platform picker, the same destination
// the Back chain ends at (history reset, nothing typed is discarded). Ignored on
// the password gate (nothing to go back to) and while Adjust Photo has the
// screen, which has its own Reset/Done controls.
function goHome(){
  if(document.getElementById('page-gate').classList.contains('is-current')) return;
  if(state.adjusting) return;
  if(state.currentPage === 'platform' && !document.getElementById('finalPage').classList.contains('is-current')) return;
  pendingTargetKey = null;
  navHistory.length = 0; navHistory.push('platform');
  goToPage('platform');
}
function bindHomeLogos(){
  document.querySelectorAll('.brand-icon').forEach(img=>{
    img.classList.add('is-home-link');
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.addEventListener('click', goHome);
    img.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); goHome(); } });
  });
}
bindHomeLogos();

(function initIntro(){
  let unlocked = false;
  try { unlocked = sessionStorage.getItem(GATE_KEY) === '1'; } catch(e){}
  if(unlocked) startWizard(); else showGate();
})();
