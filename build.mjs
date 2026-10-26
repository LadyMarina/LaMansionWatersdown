// ─────────────────────────────────────────────────────────────────────────
//  Generador estático — El Caso de la Mansión Watersdown (invitaciones web)
//  Lee los datos de /data y genera la web en /dist. No tiene secretos.
//  Uso:  node build.mjs
// ─────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(readFileSync(join(__dirname, p), 'utf8'));

const config = read('data/config.json');
const { personajes } = read('data/characters.json');
const textos = read('data/textos.json');

const BASE = 'CasoDeLaMansionWatersdown';          // segmento de ruta canónico
const DIST = join(__dirname, 'dist');

// ── Normalización de la contraseña (DEBE coincidir con la del navegador) ────
// minúsculas · sin tildes/diéresis (NFD) · sin artículo inicial · sin espacios
// ni puntuación.  Así «Telón», «TELON», « telón. » y «el telón» → "telon".
const DIACRITICOS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
function normalizar(raw) {
  let s = String(raw == null ? '' : raw);
  s = s.normalize('NFD').replace(DIACRITICOS, ''); // quita diacríticos
  s = s.toLowerCase().trim();
  s = s.replace(/^(una|un|la|el)\s+/, '');                // artículo inicial
  s = s.replace(/[^a-z0-9]+/g, '');                       // espacios y puntuación
  return s;
}
// Ruta secreta = primeros 16 hex del SHA-256 de la contraseña normalizada.
function rutaDe(password) {
  return createHash('sha256').update(normalizar(password), 'utf8').digest('hex').slice(0, 16);
}

// ── Mapa personaje → ruta secreta (las contraseñas NO se publican) ──────────
// Se leen de contrasenas.json (archivo local del proyecto, fuera de /dist).
let contrasenas = {};
try {
  contrasenas = read('contrasenas.json');
} catch {
  console.error('✗ Falta contrasenas.json. Crea ese archivo (ver README) y reintenta.');
  process.exit(1);
}
const rutas = {};        // { Mallory: 'a3f9…', … }
for (const p of personajes) {
  const pw = contrasenas[p.ruta];
  if (!pw || !normalizar(pw)) {
    console.error(`✗ Sin contraseña válida para «${p.ruta}» en contrasenas.json.`);
    process.exit(1);
  }
  rutas[p.ruta] = rutaDe(pw);
}
const hashesValidos = personajes.map((p) => rutas[p.ruta]);  // solo hashes, sin nombres

// ── utilidades ────────────────────────────────────────────────────────────
const esc = (s = '') =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const DIAMOND = '<div class="rule" aria-hidden="true"><span>&#9670;</span></div>';

// ── CSS (art déco, 1930, móvil primero) ───────────────────────────────────
const CSS = `
:root{
  --noche:#0b1020; --noche-2:#121a33; --burdeos:#3a0d1b; --burdeos-2:#521327;
  --oro:#c9a24b; --oro-claro:#e7cf93; --crema:#f3e9d2; --crema-tenue:#cdbf9f;
  --papel:#efe4c9; --papel-2:#e4d6b4; --sepia:#2a2118;
  --sombra:0 18px 50px rgba(0,0,0,.55);
  --serif-titulo:'Playfair Display', Georgia, serif;
  --serif-sub:'Cormorant Garamond', Georgia, serif;
  --serif-texto:'EB Garamond', Georgia, 'Times New Roman', serif;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0; color:var(--crema); font-family:var(--serif-texto);
  font-size:18px; line-height:1.65; letter-spacing:.2px;
  background:
    radial-gradient(130% 90% at 50% -10%, #1a2342 0%, var(--noche) 55%, #05070f 100%),
    var(--noche);
  background-attachment:fixed;
}
body::before{
  content:""; position:fixed; inset:0; pointer-events:none; opacity:.5; z-index:0;
  background:
    repeating-linear-gradient(45deg, rgba(201,162,75,.045) 0 2px, transparent 2px 22px),
    repeating-linear-gradient(-45deg, rgba(201,162,75,.045) 0 2px, transparent 2px 22px);
}
.wrap{position:relative; z-index:1; max-width:720px; margin:0 auto; padding:28px 18px 72px}
a{color:var(--oro-claro)}

/* Encabezados y filetes */
h1,h2,h3{font-family:var(--serif-titulo); font-weight:700; letter-spacing:.5px; line-height:1.15; margin:0}
.eyebrow{font-family:var(--serif-sub); text-transform:uppercase; letter-spacing:.42em;
  font-size:.74rem; color:var(--oro); margin:0 0 .4rem; text-align:center}
.rule{display:flex; align-items:center; gap:14px; color:var(--oro); margin:26px 0}
.rule::before,.rule::after{content:""; height:1px; flex:1;
  background:linear-gradient(90deg, transparent, var(--oro) 45%, var(--oro) 55%, transparent)}
.rule span{font-size:.9rem; transform:translateY(-1px)}

/* Cabecera de la mansión */
.masthead{text-align:center; margin:6px 0 30px}
.masthead .crest{font-family:var(--serif-sub); color:var(--oro); letter-spacing:.3em;
  font-size:.8rem; text-transform:uppercase}
.masthead h1{font-size:clamp(1.7rem,7vw,2.6rem); color:var(--crema); margin:.2rem 0 .1rem}
.masthead .sub{font-family:var(--serif-sub); color:var(--crema-tenue); font-size:1.05rem; font-style:italic}

/* ── Tarjeta de invitación (papel impreso) ── */
.envelope{perspective:1200px}
.invite{
  position:relative; color:var(--sepia); text-align:center;
  background:
    radial-gradient(120% 80% at 50% 0%, #fff6e2 0%, var(--papel) 55%, var(--papel-2) 100%);
  border-radius:4px; padding:40px 26px 34px;
  box-shadow:var(--sombra);
  animation:cardOut 1.15s cubic-bezier(.2,.75,.25,1) both .15s;
  transform-origin:center bottom;
}
.invite::before{
  content:""; position:absolute; inset:12px; border:1px solid rgba(90,58,20,.5);
  border-radius:2px; pointer-events:none;
}
.invite::after{
  content:""; position:absolute; inset:17px; border:1px solid rgba(90,58,20,.28);
  border-radius:2px; pointer-events:none;
}
.invite .corner{position:absolute; width:26px; height:26px; border:1px solid rgba(90,58,20,.55); opacity:.8}
.invite .corner.tl{top:22px; left:22px; border-right:0; border-bottom:0}
.invite .corner.tr{top:22px; right:22px; border-left:0; border-bottom:0}
.invite .corner.bl{bottom:22px; left:22px; border-right:0; border-top:0}
.invite .corner.br{bottom:22px; right:22px; border-left:0; border-top:0}
.invite .host{font-family:var(--serif-titulo); font-size:1.5rem; margin:.1rem 0 .2rem}
.invite .lead{font-family:var(--serif-sub); font-size:1.08rem; color:#4a3a22}
.invite .byhost{font-family:var(--serif-sub); font-style:italic; font-size:1.02rem; margin:.15rem 0 .1rem; color:#4a3a22}
.invite .manor{font-family:var(--serif-titulo); font-size:1.9rem; margin:.35rem 0 .1rem; color:#5a3a14}
.invite .region{font-family:var(--serif-sub); letter-spacing:.35em; text-transform:uppercase; font-size:.8rem; color:#6a4a22}
.invite .when{margin-top:.5rem; font-style:italic}
.invite .diamond{color:#8a5a1a; letter-spacing:.6em; margin:16px 0 14px; font-size:.9rem}
.invite .real{font-family:var(--serif-sub); font-size:1.12rem; color:#3a2d18}
.invite .real strong{font-family:var(--serif-titulo); font-weight:700}
.invite .meta{font-size:1rem; color:#4a3a22; margin:.2rem 0}
.invite .role{margin-top:.6rem; font-family:var(--serif-sub); font-size:1.15rem}
.invite .role b{font-family:var(--serif-titulo); color:#5a3a14}
.invite .footer{margin-top:.4rem; font-family:var(--serif-sub); letter-spacing:.14em; text-transform:uppercase; font-size:.82rem; color:#6a4a22}
.wax{display:inline-flex; align-items:center; justify-content:center; width:58px; height:58px;
  margin:4px auto 0; border-radius:50%; color:#f6e7cf;
  background:radial-gradient(circle at 35% 30%, #a8242f, #6d1420 70%, #4e0d16);
  box-shadow:inset 0 2px 6px rgba(255,255,255,.25), 0 6px 14px rgba(0,0,0,.4);
  font-family:var(--serif-titulo); font-size:1.1rem; letter-spacing:.02em}

/* ── Bloques de sección ── */
.panel{
  background:linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.015));
  border:1px solid rgba(201,162,75,.28); border-radius:6px;
  padding:24px 22px; margin:22px 0; box-shadow:0 10px 30px rgba(0,0,0,.25);
}
.section-eyebrow{font-family:var(--serif-sub); text-transform:uppercase; letter-spacing:.34em;
  font-size:.72rem; color:var(--oro); margin:0 0 .35rem}

/* Ficha del personaje — la sección protagonista */
.dossier{
  background:
    linear-gradient(180deg, rgba(82,19,39,.5), rgba(58,13,27,.35)),
    linear-gradient(180deg, rgba(255,255,255,.03), transparent);
  border:1px solid var(--oro); border-radius:8px; padding:30px 24px;
  box-shadow:0 0 0 1px rgba(201,162,75,.25) inset, var(--sombra); margin:26px 0;
}
.dossier .section-eyebrow{color:var(--oro-claro)}
.dossier h2{font-size:clamp(1.6rem,6.2vw,2.3rem); color:var(--crema)}
.dossier .alias{font-family:var(--serif-sub); font-style:italic; font-size:1.3rem; color:var(--oro-claro); margin:.2rem 0 .1rem}
.dossier .played-by{font-family:var(--serif-sub); font-size:1.02rem; color:var(--crema-tenue); margin:.5rem 0 0; letter-spacing:.04em}
.dossier .played-by b{font-family:var(--serif-titulo); color:var(--oro-claro); font-weight:600}
.dossier .bio{margin-top:1rem; font-size:1.08rem}
/* Información oculta (La Sórdida Realidad) — tras botón con ojo */
.dossier .secret{margin-top:1.4rem; border-top:1px solid rgba(201,162,75,.25); padding-top:1.1rem}
.dossier .secret summary{list-style:none; cursor:pointer; display:inline-flex; align-items:center; gap:.55rem;
  font-family:var(--serif-sub); font-size:1.02rem; letter-spacing:.04em; color:var(--oro-claro);
  padding:.5rem .95rem; border:1px solid var(--oro); border-radius:999px;
  background:linear-gradient(180deg, rgba(201,162,75,.14), rgba(201,162,75,.05)); transition:.2s}
.dossier .secret summary::-webkit-details-marker{display:none}
.dossier .secret summary:hover{background:linear-gradient(180deg, rgba(201,162,75,.24), rgba(201,162,75,.1))}
.dossier .secret .eye{font-size:1.15rem; line-height:1}
.dossier .secret[open] summary .secret-label::after{content:" (ocultar)"; color:var(--crema-tenue)}
.dossier .secret-inner{margin-top:1rem; padding:1rem 1.1rem; border-radius:8px;
  border:1px solid rgba(168,36,47,.45);
  background:linear-gradient(180deg, rgba(109,20,32,.35), rgba(58,13,27,.25))}
.dossier .secret-inner p{margin:.7rem 0; font-size:1.06rem}
.dossier .secret-inner p:first-child{margin-top:0}
.dossier .secret-warn{font-family:var(--serif-sub); font-style:italic; letter-spacing:.03em;
  color:#e7a6ad; text-transform:none; font-size:.98rem}

/* Vestuario */
.wardrobe .mine{font-size:1.06rem}
.wardrobe .mine b{color:var(--oro-claro); font-family:var(--serif-sub); font-weight:600}
.wardrobe .general{margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(201,162,75,.2);
  font-style:italic; color:var(--crema-tenue)}

/* Carta de la secretaria */
.letter h2{font-size:1.5rem; color:var(--crema); text-align:center; margin-bottom:.2rem}
.letter p{margin:.8rem 0}
.schedule{list-style:none; margin:1rem 0 0; padding:0}
.schedule li{position:relative; padding:.4rem 0 .4rem 1.4rem; border-bottom:1px dashed rgba(201,162,75,.22)}
.schedule li:last-child{border-bottom:0}
.schedule li::before{content:"&#9670;"; position:absolute; left:0; top:.45rem; color:var(--oro); font-size:.7rem}
.sign{margin-top:1.2rem; text-align:right}
.sign .hand{font-family:'Cormorant Garamond', cursive; font-style:italic; font-size:1.5rem; color:var(--oro-claro)}
.sign .role{font-size:.9rem; color:var(--crema-tenue)}

/* Acordeón — las demás invitadas */
.guests details{border:1px solid rgba(201,162,75,.25); border-radius:6px; margin:10px 0; overflow:hidden; background:rgba(255,255,255,.02)}
.guests summary{cursor:pointer; list-style:none; padding:14px 16px; display:flex; align-items:baseline; gap:10px;
  font-family:var(--serif-titulo); font-size:1.12rem; color:var(--crema)}
.guests summary::-webkit-details-marker{display:none}
.guests summary .alias{font-family:var(--serif-sub); font-style:italic; color:var(--oro-claro); font-size:1rem}
.guests summary .chev{margin-left:auto; color:var(--oro); transition:transform .25s ease}
.guests details[open] summary .chev{transform:rotate(90deg)}
.guests .body{padding:0 16px 16px; color:var(--crema-tenue)}

/* Detalles prácticos + botón calendario */
.practical{display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:center; text-align:center}
.practical .item{flex:1 1 200px; min-width:160px}
.practical .k{font-family:var(--serif-sub); text-transform:uppercase; letter-spacing:.2em; font-size:.72rem; color:var(--oro)}
.practical .v{font-size:1.02rem}
.btn{display:inline-flex; align-items:center; gap:.5rem; margin-top:4px;
  font-family:var(--serif-sub); text-transform:uppercase; letter-spacing:.18em; font-size:.82rem;
  color:var(--noche); background:linear-gradient(180deg, var(--oro-claro), var(--oro));
  border:0; border-radius:3px; padding:12px 20px; text-decoration:none; cursor:pointer;
  box-shadow:0 8px 20px rgba(201,162,75,.25)}
.btn:hover{filter:brightness(1.06)}

.footer-note{text-align:center; color:var(--crema-tenue); font-size:.82rem; margin-top:40px; font-style:italic}

/* ── La Puerta (contraseña) ── */
.door{max-width:560px}
.door .masthead{margin-bottom:18px}
.portal{position:relative; height:150px; max-width:300px; margin:6px auto 2px; perspective:1100px}
.portal .leaf{position:absolute; top:0; bottom:0; width:50%;
  background:linear-gradient(180deg, #16203c, #0c1222);
  border:1px solid var(--oro); box-shadow:inset 0 0 22px rgba(0,0,0,.55);
  transition:transform .8s cubic-bezier(.3,.7,.2,1), opacity .8s ease}
.portal .leaf::before{content:""; position:absolute; inset:10px; border:1px solid rgba(201,162,75,.4)}
.portal .leaf::after{content:""; position:absolute; left:50%; top:18px; bottom:18px; width:1px; background:rgba(201,162,75,.25)}
.portal .leaf.left{left:0; border-right:0; transform-origin:left center; border-radius:6px 0 0 6px}
.portal .leaf.right{right:0; border-left:0; transform-origin:right center; border-radius:0 6px 6px 0}
.portal .knocker{position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
  width:30px; height:30px; display:flex; align-items:center; justify-content:center;
  color:var(--oro); border:1px solid var(--oro); border-radius:50%; font-size:.8rem;
  box-shadow:0 0 12px rgba(201,162,75,.3); transition:opacity .5s ease}
body.opening .portal .leaf.left{transform:rotateY(-82deg)}
body.opening .portal .leaf.right{transform:rotateY(82deg)}
body.opening .portal .knocker{opacity:0}

.door-panel{text-align:center}
.butler{font-family:var(--serif-sub); font-style:italic; font-size:1.3rem; color:var(--oro-claro); margin:0 0 1.1rem; line-height:1.3}
#gate{display:flex; flex-direction:column; gap:12px; align-items:center}
#pw{width:100%; max-width:340px; text-align:center; color:var(--crema);
  font-family:var(--serif-sub); font-size:1.2rem; letter-spacing:.06em;
  padding:13px 14px; background:rgba(0,0,0,.28); border:1px solid var(--oro); border-radius:4px}
#pw::placeholder{color:rgba(205,191,159,.55); font-style:italic}
#pw:focus{outline:none; box-shadow:0 0 0 2px rgba(201,162,75,.35)}
.door-panel .btn{min-width:160px; justify-content:center}
.remember{display:flex; gap:.5rem; align-items:center; font-family:var(--serif-sub);
  font-size:.92rem; color:var(--crema-tenue); cursor:pointer; margin-top:2px}
.remember input{accent-color:var(--oro)}
.door-error{min-height:1.5em; margin:.3rem 0 0; color:#e7b4a0; font-style:italic;
  font-family:var(--serif-sub); font-size:1.02rem; line-height:1.3}

/* Velo de transición al abrir la puerta / llegada a la invitación */
#veil{position:fixed; inset:0; z-index:60; pointer-events:none; opacity:0;
  background:radial-gradient(circle at 50% 42%, rgba(231,207,147,.12), #05070f 70%);
  transition:opacity .85s ease}
body.opening #veil{opacity:1}
.arrive{animation:pageIn .7s ease both}
@keyframes pageIn{from{opacity:0; transform:translateY(8px)} to{opacity:1; transform:none}}

/* "No soy yo / cambiar de invitada" */
.switch-guest{text-align:center; margin-top:34px}
.switch-guest a{font-family:var(--serif-sub); font-size:.9rem; color:var(--crema-tenue);
  text-decoration:none; border-bottom:1px solid rgba(201,162,75,.35); padding-bottom:1px}
.switch-guest a:hover{color:var(--oro-claro)}

@keyframes shake{
  10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(4px)}
  30%,50%,70%{transform:translateX(-8px)} 40%,60%{transform:translateX(8px)}
}
#pw.shake{animation:shake .5s}
@media (prefers-reduced-motion:reduce){
  .portal .leaf{transition:none} #veil{transition:none} .arrive{animation:none} #pw.shake{animation:none}
}

@keyframes cardOut{
  0%{transform:translateY(42px) rotateX(10deg) scale(.985); opacity:0}
  100%{transform:none; opacity:1}
}
@media (prefers-reduced-motion:reduce){
  .invite{animation:none}
}
@media (min-width:640px){
  body{font-size:19px}
  .wrap{padding-top:40px}
  .invite{padding:52px 44px 40px}
}
`;

// ── <head> común ──────────────────────────────────────────────────────────
function head({ title, description, path, robots }) {
  const url = config.siteUrl ? config.siteUrl.replace(/\/$/, '') + path : '';
  const robotsMeta = robots ? `\n  <meta name="robots" content="${esc(robots)}">` : '';
  const og = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:locale" content="es_ES">`,
    url ? `<meta property="og:url" content="${esc(url)}">` : '',
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
  ].filter(Boolean).join('\n  ');
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#0b1020">${robotsMeta}
  ${og}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=EB+Garamond:ital@0;1&display=swap" rel="stylesheet">
  <style>${CSS}</style>
</head>`;
}

// ── Tarjeta de invitación (solo la invitación «en personaje» de Sir Roger) ──
function invitationCard(p) {
  const i = textos.invitacion;
  return `<section class="envelope" aria-label="Tarjeta de invitación">
  <article class="invite">
    <span class="corner tl"></span><span class="corner tr"></span>
    <span class="corner bl"></span><span class="corner br"></span>
    <div class="host">${esc(p.nombre)} ${esc(p.apodo)}</div>
    <div class="lead">${esc(i.introFiccion)}</div>
    <div class="manor">${esc(i.lugar)}</div>
    <div class="byhost">de la mano de ${esc(i.anfitrion)}</div>
    <div class="region">${esc(i.region)}</div>
    <div class="when">${esc(i.fechaFiccion)}</div>
    <div class="wax" aria-hidden="true">RW</div>
  </article>
</section>`;
}

// ── Ficha del personaje (protagonista) ────────────────────────────────────
function dossier(p) {
  const jugadora = (config.jugadoras && config.jugadoras[p.ruta]) || '';
  const rol = jugadora
    ? `\n  <p class="played-by">${esc(textos.invitacion.enElPapelDe)} <b>${esc(jugadora)}</b></p>`
    : '';
  const imagen = Array.isArray(p.tuImagen) ? p.tuImagen : (p.tuImagen ? [p.tuImagen] : [p.bio]);
  const imagenHtml = imagen.map((t) => `<p class="bio">${esc(t)}</p>`).join('\n  ');
  const secreto = Array.isArray(p.secreto) ? p.secreto : (p.secreto ? [p.secreto] : []);
  const secretoHtml = secreto.length
    ? `
  <details class="secret">
    <summary>
      <span class="eye" aria-hidden="true">&#128065;</span>
      <span class="secret-label">Información oculta — solo para ti</span>
    </summary>
    <div class="secret-inner">
      <p class="secret-warn">No facilites esta información a las demás invitadas.</p>
      ${secreto.map((t) => `<p>${esc(t)}</p>`).join('\n      ')}
    </div>
  </details>`
    : '';
  return `<section class="dossier" aria-label="Ficha del personaje">
  <p class="section-eyebrow">Ficha del personaje</p>
  <h2>${esc(p.nombre)}</h2>
  <div class="alias">${esc(p.apodo)}</div>${rol}
  ${imagenHtml}${secretoHtml}
</section>`;
}

// ── Vestuario ─────────────────────────────────────────────────────────────
function wardrobe(p) {
  return `<section class="panel wardrobe" aria-label="Sugerencia de vestuario">
  <p class="section-eyebrow">Sugerencia de vestuario</p>
  <p class="mine"><b>${esc(p.nombre)}:</b> ${esc(p.vestuario)}</p>
  <p class="general">${esc(textos.notaVestuario)}</p>
</section>`;
}

// ── Carta de la secretaria ────────────────────────────────────────────────
function letter() {
  const c = textos.carta;
  return `<section class="panel letter" aria-label="Carta de la secretaria">
  <h2>${esc(c.titulo)}</h2>
  ${DIAMOND}
  ${c.parrafos.map((t) => `<p>${esc(t)}</p>`).join('\n  ')}
  <ul class="schedule">
    ${c.horario.map((h) => `<li>${esc(h)}</li>`).join('\n    ')}
  </ul>
  <div class="sign">
    <div>${esc(c.despedida)}</div>
    <div class="hand">${esc(c.firma)}</div>
    <div class="role">${esc(c.firmaCargo)}</div>
  </div>
</section>`;
}

// ── Acordeón: las demás invitadas ─────────────────────────────────────────
function otherGuests(current) {
  const items = personajes
    .filter((o) => o.ruta !== current.ruta)
    .map(
      (o) => `<details>
    <summary><span>${esc(o.nombre)}</span> <span class="alias">${esc(o.apodo)}</span> <span class="chev" aria-hidden="true">&#9654;</span></summary>
    <div class="body">${esc(o.bio)}</div>
  </details>`
    )
    .join('\n  ');
  return `<section class="panel guests" aria-label="Las demás invitadas">
  <p class="section-eyebrow">Las demás invitadas</p>
  ${items}
</section>`;
}

// ── Página completa de un personaje (en ruta secreta por hash) ─────────────
function characterPage(p, hash) {
  const title = `Invitación a la Mansión Watersdown — ${p.nombre}`;
  const description = `Está Ud. cordialmente invitada al fin de semana en la Mansión Watersdown (Yorkshire, 1936), en el papel de ${p.nombre} ${p.apodo}. Una murder party de misterio y época.`;
  const path = `/${BASE}/${hash}/`;
  return `${head({ title, description, path, robots: 'noindex,nofollow' })}
<body>
  <div id="veil" aria-hidden="true"></div>
  <main class="wrap arrive">
    <header class="masthead">
      <div class="crest">&#9670; Watersdown Manor &#9670;</div>
      <h1>La Mansión Watersdown</h1>
      <div class="sub">Yorkshire, Inglaterra &middot; 1936</div>
    </header>

    ${invitationCard(p)}
    ${dossier(p)}
    ${wardrobe(p)}
    ${letter()}
    ${otherGuests(p)}

    <p class="switch-guest"><a href="../" id="notme">&#8592; ¿No es su invitación? Cambiar de invitada</a></p>
    <p class="footer-note">Cómo Organizar un Asesinato &middot; El Caso de la Mansión Watersdown</p>
  </main>
  <script>
    // "No soy yo": olvida el dispositivo y vuelve a la puerta.
    (function(){
      var a = document.getElementById('notme');
      if(a){ a.addEventListener('click', function(){ try{ localStorage.removeItem('watersdown.ruta'); }catch(e){} }); }
    })();
  </script>
</body>
</html>`;
}

// ── La Puerta (raíz /BASE/): pide la contraseña y abre la invitación ───────
// OG genérico y misterioso, SIN nombres de personaje.  La comprobación se hace
// en el navegador: normaliza lo escrito, calcula SHA-256 y, si el hash está en
// la lista de rutas válidas, redirige a /BASE/<hash>/.  No hay contraseñas ni
// nombres en el código: solo la lista de hashes (que no revela nada).
function doorPage() {
  const title = 'Una invitación a la Mansión Watersdown';
  const description = 'Solo quien conozca la contraseña podrá entrar…';
  const mensajes = [
    'El mayordomo arquea una ceja. «Me temo que esa no es la contraseña, madame.»',
    'El mayordomo no se inmuta. «Inténtelo de nuevo… Sir Roger no espera a nadie.»',
    'El mayordomo niega con la cabeza. «No puedo franquearle el paso con eso, madame.»',
    'El mayordomo consulta su reloj de bolsillo. «Esa no es la palabra. Repase su invitación.»',
    'El mayordomo entorna los ojos. «La mansión guarda bien sus secretos. Pruebe otra vez.»',
  ];
  return `${head({ title, description, path: `/${BASE}/` })}
<body>
  <div id="veil" aria-hidden="true"></div>
  <main class="wrap door">
    <header class="masthead">
      <div class="crest">&#9670; Watersdown Manor &#9670;</div>
      <h1>La Mansión Watersdown</h1>
      <div class="sub">Yorkshire, 1936</div>
    </header>

    <div class="portal" aria-hidden="true">
      <div class="leaf left"></div>
      <div class="leaf right"></div>
      <div class="knocker">&#9670;</div>
    </div>

    <section class="panel door-panel">
      <p class="butler">«Buenas noches. ¿La contraseña, por favor?»</p>
      <form id="gate" autocomplete="off" novalidate>
        <input id="pw" name="pw" type="text" inputmode="text"
               autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false"
               placeholder="Susurre la contraseña…" aria-label="Contraseña" enterkeyhint="go">
        <button class="btn" type="submit">Entrar</button>
        <label class="remember"><input type="checkbox" id="remember"> Recordarme en este dispositivo</label>
        <p id="err" class="door-error" role="alert" aria-live="polite"></p>
      </form>
    </section>

    <p class="footer-note">Cómo Organizar un Asesinato &middot; El Caso de la Mansión Watersdown</p>
  </main>

  <noscript>
    <p style="text-align:center;color:#e7cf93;font-family:Georgia,serif">
      Active JavaScript para poder susurrar la contraseña al mayordomo.
    </p>
  </noscript>

  <script>
  (function () {
    var VALIDOS = ${JSON.stringify(hashesValidos)};
    var MENSAJES = ${JSON.stringify(mensajes)};
    var KEY = 'watersdown.ruta';

    function normalizar(raw) {
      var s = (raw == null ? '' : String(raw));
      s = s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
      s = s.toLowerCase().replace(/^\\s+|\\s+$/g, '');
      s = s.replace(/^(una|un|la|el)\\s+/, '');
      s = s.replace(/[^a-z0-9]+/g, '');
      return s;
    }
    async function hash16(norm) {
      var data = new TextEncoder().encode(norm);
      var buf = await crypto.subtle.digest('SHA-256', data);
      var arr = Array.prototype.slice.call(new Uint8Array(buf));
      return arr.map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join('').slice(0, 16);
    }
    function irA(hash) {
      document.body.classList.add('opening');
      setTimeout(function () { location.assign('./' + hash + '/'); }, 850);
    }

    // Entrada directa si ya se recordó el dispositivo.
    try {
      var guardado = localStorage.getItem(KEY);
      if (guardado && VALIDOS.indexOf(guardado) !== -1) { location.replace('./' + guardado + '/'); return; }
    } catch (e) {}

    var form = document.getElementById('gate');
    var input = document.getElementById('pw');
    var err = document.getElementById('err');
    var remember = document.getElementById('remember');
    var intentos = 0;

    function fallo() {
      err.textContent = MENSAJES[intentos % MENSAJES.length];
      intentos++;
      input.classList.remove('shake');
      void input.offsetWidth;        // reinicia la animación
      input.classList.add('shake');
      input.focus();
      input.select();
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var norm = normalizar(input.value);
      if (!norm) { fallo(); return; }
      var h;
      try { h = await hash16(norm); } catch (e) { fallo(); return; }
      if (VALIDOS.indexOf(h) !== -1) {
        try { if (remember.checked) localStorage.setItem(KEY, h); } catch (e) {}
        irA(h);
      } else {
        fallo();
      }
    });

    if (input) input.focus();
  })();
  </script>
</body>
</html>`;
}

// ── Página 404 temática ────────────────────────────────────────────────────
// Se sirve ante cualquier ruta inexistente: rutas antiguas con nombre (/Donna),
// hashes inválidos (contraseña incorrecta escrita a mano en la URL), mayúsculas,
// etc.  Si la ruta pertenece a la mansión, devuelve a la Puerta; en otro caso
// muestra la puerta cerrada con doble cerradura.
function notFoundPage() {
  const title = 'Puerta cerrada — La Mansión Watersdown';
  const description = 'Esta puerta de la mansión está cerrada con doble cerradura.';
  const router = `
  (function () {
    var BASE = ${JSON.stringify(BASE)};
    try {
      var segs = location.pathname.split('/');
      var bi = -1;
      for (var i = 0; i < segs.length; i++) {
        if (segs[i].toLowerCase() === BASE.toLowerCase()) { bi = i; break; }
      }
      if (bi !== -1) {
        // Pertenece a la mansión → de vuelta a la Puerta (ruta canónica).
        segs[bi] = BASE;
        var dest = segs.slice(0, bi + 1).join('/') + '/';
        if (dest !== location.pathname) { location.replace(dest); return; }
      }
    } catch (e) {}
    var el = document.getElementById('closed');
    if (el) el.style.display = '';
  })();`;
  return `${head({ title, description, path: '/404', robots: 'noindex,nofollow' })}
<body>
  <main class="wrap" id="closed" style="display:none">
    <header class="masthead" style="margin-top:10vh">
      <div class="crest">&#9670; Watersdown Manor &#9670;</div>
      <h1>Puerta cerrada</h1>
    </header>
    ${DIAMOND}
    <section class="panel" style="text-align:center">
      <p style="font-size:1.2rem">&#128274; Esta puerta de la mansión está cerrada con doble cerradura.</p>
      <p style="color:var(--crema-tenue);font-style:italic">Compruebe el enlace de su invitación personal; quizá se haya equivocado de ala de la mansión.</p>
      <p style="margin-top:1rem"><a class="btn" href="/${BASE}/">Volver a la puerta</a></p>
    </section>
  </main>
  <noscript>
    <div style="text-align:center;padding:12vh 1rem;color:#e7cf93;font-family:Georgia,serif">
      <p style="font-size:1.2rem">&#128274; Esta puerta de la mansión está cerrada con doble cerradura.</p>
      <p><a style="color:#e7cf93" href="/${BASE}/">Volver a la puerta</a></p>
    </div>
  </noscript>
  <script>${router}</script>
</body>
</html>`;
}

// ── Fichero .ics del calendario ───────────────────────────────────────────
function icsFile() {
  const c = config.calendario || {};
  const fmt = (iso) => {
    // '2026-01-16T20:00:00' -> '20260116T200000' (hora local flotante)
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(iso || '');
    if (!m) return '';
    return `${m[1]}${m[2]}${m[3]}T${m[4]}${m[5]}${m[6] || '00'}`;
  };
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const start = fmt(c.inicio);
  const end = fmt(c.fin) || start;
  const descLines = [
    'El Caso de la Mansion Watersdown — una murder party de misterio.',
    `Anfitriona: ${config.anfitriona}`,
    `Codigo de vestimenta: ${config.codigoVestimenta}`,
    config.confirmacion ? `Confirmacion: ${config.confirmacion}` : '',
  ].filter(Boolean).join('\\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mansion Watersdown//Murder Party//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:watersdown-${start || 'tbd'}@murder.party`,
    `DTSTAMP:${stamp}`,
    start ? `DTSTART:${start}` : '',
    end ? `DTEND:${end}` : '',
    `SUMMARY:${(c.titulo || 'Murder Party — Mansion Watersdown').replace(/,/g, '\\,')}`,
    `DESCRIPTION:${descLines}`,
    config.direccion ? `LOCATION:${String(config.direccion).replace(/,/g, '\\,')}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n') + '\r\n';
}

// ── Escritura (resistente a archivos bloqueados por el sistema/OneDrive) ────
function safeWrite(relPath, content) {
  const full = join(DIST, relPath);
  try {
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content, 'utf8');
  } catch (e) {
    if (e.code === 'EBUSY' || e.code === 'EPERM') {
      console.warn(`  ⚠ ${relPath} está en uso; se conserva el existente.`);
    } else throw e;
  }
}
function safeRm(relPath) {
  try {
    rmSync(join(DIST, relPath), { recursive: true, force: true });
  } catch (e) {
    if (!(e.code === 'EBUSY' || e.code === 'EPERM')) throw e;
    console.warn(`  ⚠ No se pudo limpiar ${relPath} (en uso).`);
  }
}

mkdirSync(DIST, { recursive: true });
// Limpieza selectiva: borra la mansión entera (puerta + rutas antiguas con
// nombre + hashes previos).  El index.html raíz es un redirector fijo que no
// cambia, así que no hace falta reescribirlo si está bloqueado.
safeRm(BASE);
safeRm('404.html');
safeRm('netlify.toml');

const ics = icsFile();

// La Puerta (pide la contraseña)
safeWrite(`${BASE}/index.html`, doorPage());
// Calendario .ics (las invitaciones lo enlazan como ../invitacion.ics)
safeWrite(`${BASE}/invitacion.ics`, ics);
// Invitaciones en rutas secretas por hash
for (const p of personajes) {
  safeWrite(`${BASE}/${rutas[p.ruta]}/index.html`, characterPage(p, rutas[p.ruta]));
}

// 404 en la raíz (GitHub Pages / Netlify lo sirven automáticamente)
safeWrite('404.html', notFoundPage());

// Redirección desde la raíz del sitio a la Puerta
safeWrite(
  'index.html',
  `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=./${BASE}/">
<link rel="canonical" href="./${BASE}/">
<title>La Mansión Watersdown</title></head>
<body style="background:#0b1020;color:#e7cf93;font-family:Georgia,serif;text-align:center;padding:20vh 1rem">
<p>Entrando en la Mansión Watersdown…</p>
<p><a style="color:#e7cf93" href="./${BASE}/">Pulse aquí si no avanza</a></p></body></html>`
);

// Netlify: sirve 404.html en rutas no encontradas
safeWrite('netlify.toml', `[build]\n  publish = "."\n\n[[redirects]]\n  from = "/*"\n  to = "/404.html"\n  status = 404\n`);

// Evita que GitHub Pages procese con Jekyll
safeWrite('.nojekyll', '');

console.log(`✓ Generado en /dist`);
console.log(`  · La Puerta: /${BASE}/  (enlace para todas las invitadas)`);
console.log(`  · ${personajes.length} invitaciones en rutas secretas (noindex):`);
for (const p of personajes) {
  console.log(`      ${p.ruta.padEnd(12)} → /${BASE}/${rutas[p.ruta]}/`);
}
console.log(`  · Las contraseñas NO se escriben en /dist (solo sus hashes de ruta).`);
