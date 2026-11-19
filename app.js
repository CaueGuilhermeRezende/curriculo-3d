import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ------------------------------------------------------------------ conteúdo
const SALAS = {
  '01': { nome: 'Recepção', tema: 'Sobre mim', cam: 'CAM_01_SobreMim', hit: 'HIT_SALA_01_Recepcao', quadro: 'QUADRO_01_SobreMim',
    html: `<h2>Sobre mim</h2><p class="tema">01 · Recepção</p>
      <p><strong>Cauê Guilherme</strong> · 21 anos · São Caetano do Sul (SP)</p>
      <p>Trabalho há cerca de um ano na área de Contingência Operacional do Itaú Unibanco e curso Administração na USCS.</p>
      <h3>Perfil</h3><p>Comunicativo, observador e colaborativo.</p>
      <h3>Nas horas vagas</h3><p class="pendente">[hobbies] · [interesses]</p>` },
  '02': { nome: 'Sala de reunião', tema: 'Trajetória corporativa', cam: 'CAM_02_Trajetoria', hit: 'HIT_SALA_02_Reuniao', quadro: 'QUADRO_02_Trajetoria',
    html: `<h2>Trajetória</h2><p class="tema">02 · Sala de reunião</p>
      <div class="destaque"><strong>Itaú Unibanco</strong><br>Estagiário · Contingência Operacional · out/2025 – hoje</div>
      <ul><li>Dados de Resiliência Operacional</li><li>Organização da parte de negócios no teste de Disaster Recovery</li>
      <li>Relatório de processos de Resiliência Operacional</li><li>Uso de IA no dia a dia</li><li>Cobrança e apoio a equipes internas e externas</li></ul>
      <div class="destaque"><strong>Itaú Unibanco</strong><br>Jovem Aprendiz · out/2024 – out/2025</div>
      <ul><li>Publicação de documentos do mercado de capitais</li><li>Automações e manutenção de robôs</li><li>Melhoria de processos com ChatGPT e Copilot</li></ul>
      <h3>Gestão Certa · Estagiário · fev–ago/2024</h3><p>Notas fiscais, rotinas fiscais, abertura de empresas, prazos e metas da equipe.</p>
      <h3>JUG Construções · Auxiliar Administrativo · fev/2023 – jan/2024</h3><p>Compra de materiais, atendimento a clientes, relatórios de obras e laudos técnicos.</p>
      <h3>Ferramentas</h3><p>Office, Power BI, Copilot, Canva.</p>` },
  '03': { nome: 'Sala de estudos', tema: 'Formação', cam: 'CAM_03_Academica', hit: 'HIT_SALA_03_Academica', quadro: 'QUADRO_03_Academica',
    html: `<h2>Formação</h2><p class="tema">03 · Sala de estudos</p>
      <h3>Administração · USCS</h3><p>fev/2024 – dez/2028 · 4º semestre</p>
      <h3>Tecnólogo em Análise e Desenvolvimento de Sistemas</h3><p>Fatec São Caetano do Sul – Antonio Russo · 2022–2023</p>
      <h3>Cursos</h3><p>T-Systems (2022)</p>
      <h3>Idiomas</h3><p>Inglês intermediário</p>` },
  '04': { nome: 'Sala do chefe', tema: 'Próximos passos', cam: 'CAM_04_Futuro', hit: 'HIT_SALA_04_Chefe', quadro: 'QUADRO_04_Futuro',
    html: `<h2>Próximos passos</h2><p class="tema">04 · Sala do chefe</p>
      <h3>Em 1 ano</h3><p class="pendente">[objetivo em 1 ano]</p>
      <h3>Em 3 anos</h3><p class="pendente">[objetivo em 3 anos]</p>
      <h3>Foco atual</h3><p>Continuidade de negócios: BIA · PCO · DR</p>
      <h3>Onde quero chegar</h3><p class="pendente">[onde quero chegar]</p>` },
};
const PLANTA = { posicao: [-2.5, 21, 16.5], alvo: [-2.5, 0, -0.4] };
const ESCONDER_NA_PLANTA = /^(FORRO|LUMINARIA|VISTA)/;

// ------------------------------------------------------------------ cena
const canvas = document.getElementById('cena');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b1c1f);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.32;
scene.add(new THREE.HemisphereLight(0xfff6e8, 0x5e5a52, 0.55));
// luz de cada ambiente (convertido de Blender (x,y) -> three (x, -y))
for (const [x, y, i, c] of [[-9.3, 1.6, 14, 0xffe2c0], [2.9, 5.75, 16, 0xfff4e6], [-8.25, -6, 14, 0xf4f6ff], [-5.1, 5.6, 14, 0xffd8a8],
  [-2, -0.6, 12, 0xf2f6ff], [2.8, -0.6, 12, 0xf2f6ff], [-2, -5.4, 12, 0xf2f6ff], [2.8, -5.4, 12, 0xf2f6ff],
  [-9.5, 6, 10, 0xffeedd], [-9.8, 10, 6, 0xffeedd]]) {
  const L = new THREE.PointLight(c, i, 9, 2); L.position.set(x, 2.45, -y); scene.add(L);
}
const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 120);
let tourCam = null;

function ajustarTamanho() {
  const w = innerWidth, h = innerHeight, a = w / h;
  renderer.setSize(w, h, false);
  // ~65° de campo horizontal na paisagem; no celular em pé, limita o vertical
  const vfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(32.75)) / a);
  camera.fov = Math.min(THREE.MathUtils.radToDeg(vfov), 78) * zoom;
  camera.aspect = a; camera.updateProjectionMatrix();
  if (tourCam) { tourCam.aspect = a; tourCam.fov = camera.fov / zoom; tourCam.updateProjectionMatrix(); }
}
let zoom = 1;
addEventListener('resize', ajustarTamanho);

// ------------------------------------------------------------------ carregar
const ui = (id) => document.getElementById(id);
let info = null, mixer = null, clips = [], hits = [], plantaEsconder = [];
const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/gltf/');
const loader = new GLTFLoader().setDRACOLoader(draco);

Promise.all([
  fetch('cena_info.json').then((r) => r.json()),
  new Promise((ok, erro) => loader.load('curriculo_caue_3d_draco.glb', ok,
    (e) => { if (e.total) { const p = Math.round(e.loaded / e.total * 100); ui('carga').style.width = p + '%'; ui('carga-txt').textContent = `Carregando o escritório… ${p}%`; } },
    erro)),
]).then(([json, gltf]) => {
  info = json;
  scene.add(gltf.scene);
  gltf.scene.traverse((o) => {
    if (o.name.startsWith('HIT_')) { o.material = o.material.clone(); o.material.visible = false; hits.push(o); }
    if (ESCONDER_NA_PLANTA.test(o.name)) plantaEsconder.push(o);
    if (o.isMesh && o.material && o.material.transparent) o.renderOrder = 2;
    // o "sheen" (brilho de tecido) exportado do Blender fica forte demais no Three.js
    if (o.isMesh) for (const m of [].concat(o.material)) if (m && m.sheen) m.sheen = 0;
    if (o.isCamera && o.name.startsWith('CAM_Tour')) tourCam = o;
  });
  if (!tourCam) gltf.scene.traverse((o) => { if (!tourCam && o.name === 'CAM_Tour') o.traverse((c) => { if (c.isCamera) tourCam = c; }); });
  mixer = new THREE.AnimationMixer(gltf.scene);
  clips = gltf.animations;
  // secretária digitando/olhando em loop
  for (const c of clips) if (/SECRETARIA/.test(c.name)) mixer.clipAction(c).play();
  ajustarTamanho();
  irPara(info.cameras.CAM_Fora, false);
  ui('carga').style.width = '100%';
  ui('carga-txt').textContent = 'Pronto!';
  ui('entrar').disabled = false;
}).catch((e) => {
  console.error(e);
  ui('carga-txt').textContent = 'Não foi possível carregar a cena 3D neste navegador.';
});

// ------------------------------------------------------------------ câmera
const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const pose = { pos: new THREE.Vector3(), dir: new THREE.Vector3(0, 0, -1) };
let yaw = 0, pitch = 0, baseYaw = 0, basePitch = 0, salaAtual = null, modo = 'inicio';

function aplicarPose() {
  const d = new THREE.Vector3(Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw));
  camera.position.copy(pose.pos);
  camera.lookAt(pose.pos.clone().add(d));
}
function definirPose(p, alvo) {
  pose.pos.copy(p);
  const d = alvo.clone().sub(p).normalize();
  baseYaw = yaw = Math.atan2(d.x, d.z);
  basePitch = pitch = Math.asin(d.y);
  aplicarPose();
}
let anim = null;   // pequena aproximação ao chegar
function irPara(c, suave = true) {
  const p = v3(c.posicao), alvo = v3(c.alvo);
  anim = null;
  if (!suave) { definirPose(p, alvo); return; }
  const recuo = p.clone().sub(alvo).setY(0).normalize().multiplyScalar(0.9);
  definirPose(p.clone().add(recuo), alvo);
  anim = { de: pose.pos.clone(), para: p, t: 0, dur: 1.1 };
}
function fadeTroca(fn) {
  const f = ui('fade'); f.classList.add('on');
  setTimeout(() => { fn(); requestAnimationFrame(() => f.classList.remove('on')); }, 360);
}

function mostrarPlanta(sim) { for (const o of plantaEsconder) o.visible = !sim; }

function irSala(id) {
  pararTour();
  fecharPainel();
  if (id === 'planta') {
    fadeTroca(() => { mostrarPlanta(true); modo = 'planta'; salaAtual = null; irPara(PLANTA, false); zoom = 1; ajustarTamanho(); atualizarUI(); });
    return;
  }
  const s = SALAS[id];
  fadeTroca(() => { mostrarPlanta(false); modo = 'sala'; salaAtual = id; zoom = 1; ajustarTamanho(); irPara(info.cameras[s.cam]); atualizarUI(); });
}

function atualizarUI() {
  document.querySelectorAll('#nav button[data-sala]').forEach((b) =>
    b.classList.toggle('ativo', b.dataset.sala === (salaAtual || (modo === 'planta' ? 'planta' : ''))));
  const topo = ui('topo');
  if (salaAtual) {
    const s = SALAS[salaAtual];
    ui('sala-num').textContent = salaAtual; ui('sala-nome').textContent = s.nome; ui('sala-tema').textContent = s.tema;
    topo.classList.remove('oculto');
  } else topo.classList.add('oculto');
}

// ------------------------------------------------------------------ painéis
function abrirPainel(id) {
  ui('painel-conteudo').innerHTML = SALAS[id].html;
  ui('painel').classList.add('aberto'); ui('painel').setAttribute('aria-hidden', 'false');
}
function fecharPainel() { ui('painel').classList.remove('aberto'); ui('painel').setAttribute('aria-hidden', 'true'); }
ui('btn-info').onclick = () => salaAtual && (ui('painel').classList.contains('aberto') ? fecharPainel() : abrirPainel(salaAtual));
ui('btn-contato').onclick = () => ui('contato').classList.toggle('aberto');
document.querySelectorAll('[data-fechar]').forEach((b) => b.onclick = () => {
  ui(b.dataset.fechar).classList.remove('aberto'); ui(b.dataset.fechar).setAttribute('aria-hidden', 'true');
});
document.querySelectorAll('#nav button[data-sala]').forEach((b) => b.onclick = () => irSala(b.dataset.sala));

// ------------------------------------------------------------------ entrada e tour
ui('entrar').onclick = () => {
  ui('inicio').classList.add('saindo');
  modo = 'entrando';
  // portas se abrem, depois a recepção
  for (const c of clips) if (/PORTA_Entrada/.test(c.name)) {
    const a = mixer.clipAction(c); a.reset(); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; a.timeScale = 1.6; a.play();
  }
  setTimeout(() => {
    ['nav', 'btn-contato', 'dica'].forEach((i) => ui(i).classList.remove('oculto'));
    setTimeout(() => ui('dica').classList.add('oculto'), 6000);
    irSala('01');
  }, 1700);
};

let tourAction = null;
ui('btn-tour').onclick = () => (tourAction ? pararTour() : iniciarTour());
function iniciarTour() {
  const clip = clips.find((c) => /CAM_Tour/.test(c.name));
  if (!clip || !tourCam) return;
  fecharPainel(); mostrarPlanta(false); salaAtual = null; atualizarUI();
  for (const c of clips) if (/PORTA_Entrada/.test(c.name)) { const a = mixer.clipAction(c); a.reset(); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; a.timeScale = 1; a.play(); }
  tourAction = mixer.clipAction(clip); tourAction.reset(); tourAction.setLoop(THREE.LoopOnce); tourAction.clampWhenFinished = true; tourAction.play();
  modo = 'tour'; ui('btn-tour').textContent = '■ Parar tour'; ajustarTamanho();
}
function pararTour() {
  if (!tourAction) return;
  tourAction.stop(); tourAction = null; modo = 'sala';
  ui('btn-tour').textContent = '▶ Tour';
}

// ------------------------------------------------------------------ olhar, zoom e clique
const ray = new THREE.Raycaster();
let arrastando = false, moveu = 0, ult = null, pinca = null;
const ptrs = new Map();
function salaDoObjeto(o) {
  for (let p = o; p; p = p.parent) {
    const m = p.name.match(/(?:HIT_SALA|SALA|QUADRO|PLACA|PORTA)_(0[1-4])/);
    if (m) return m[1];
  }
  return null;
}
function apontar(x, y) {
  ray.setFromCamera(new THREE.Vector2(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1), camera);
  if (modo === 'planta') { const h = ray.intersectObjects(hits, false)[0]; return h ? salaDoObjeto(h.object) : null; }
  for (const h of ray.intersectObjects(scene.children, true)) {
    if (!h.object.visible || h.object.name.startsWith('HIT_')) continue;
    const m = h.object.material;
    if (m && m.transparent && m.opacity < 0.5) continue;   // atravessa vidros
    return salaDoObjeto(h.object);
  }
  return null;
}
canvas.addEventListener('pointerdown', (e) => {
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  canvas.setPointerCapture(e.pointerId);
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinca = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom }; }
  arrastando = true; moveu = 0; ult = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointermove', (e) => {
  if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinca && ptrs.size === 2) {
    const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
    zoom = THREE.MathUtils.clamp(pinca.z * pinca.d / d, 0.35, 1); ajustarTamanho(); return;
  }
  if (arrastando && ult && modo !== 'tour' && modo !== 'inicio') {
    const dx = e.clientX - ult.x, dy = e.clientY - ult.y; moveu += Math.abs(dx) + Math.abs(dy);
    const k = 0.0035 * zoom;
    if (modo === 'planta') { yaw -= dx * k * 0.5; }
    else {
      yaw = THREE.MathUtils.clamp(yaw + dx * k, baseYaw - 1.3, baseYaw + 1.3);
      pitch = THREE.MathUtils.clamp(pitch + dy * k, basePitch - 0.5, basePitch + 0.5);
    }
    if (modo === 'planta') orbitarPlanta(); else aplicarPose();
    ult = { x: e.clientX, y: e.clientY };
  } else if (!arrastando) {
    canvas.classList.toggle('apontando', !!(modo !== 'tour' && apontar(e.clientX, e.clientY)));
  }
});
function soltar(e) {
  ptrs.delete(e.pointerId);
  if (ptrs.size < 2) pinca = null;
  if (arrastando && moveu < 6 && ptrs.size === 0 && modo !== 'tour' && modo !== 'inicio') {
    const s = apontar(e.clientX, e.clientY);
    if (s && s === salaAtual) abrirPainel(s); else if (s) irSala(s);
  }
  if (ptrs.size === 0) arrastando = false;
}
canvas.addEventListener('pointerup', soltar);
canvas.addEventListener('pointercancel', soltar);
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (modo === 'sala') { zoom = THREE.MathUtils.clamp(zoom * (e.deltaY > 0 ? 1.1 : 0.9), 0.35, 1); ajustarTamanho(); }
}, { passive: false });
function orbitarPlanta() {
  const c = v3(PLANTA.alvo), p = v3(PLANTA.posicao).sub(c);
  const r = Math.hypot(p.x, p.z), ang = Math.atan2(p.x, p.z) + (yaw - baseYaw);
  camera.position.set(c.x + Math.sin(ang) * r, c.y + p.y, c.z + Math.cos(ang) * r);
  camera.lookAt(c);
}
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { fecharPainel(); ui('contato').classList.remove('aberto'); }
  if (['1', '2', '3', '4'].includes(e.key) && modo !== 'inicio') irSala('0' + e.key);
});

// ------------------------------------------------------------------ loop
const relogio = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(relogio.getDelta(), 0.05);
  if (mixer) mixer.update(dt);
  if (anim) {
    anim.t += dt / anim.dur; const t = 1 - Math.pow(1 - Math.min(anim.t, 1), 3);
    pose.pos.lerpVectors(anim.de, anim.para, t); aplicarPose();
    if (anim.t >= 1) anim = null;
  }
  if (tourAction && !tourAction.isRunning()) { pararTour(); irSala('04'); }
  renderer.render(scene, modo === 'tour' && tourCam ? tourCam : camera);
});
ajustarTamanho();
