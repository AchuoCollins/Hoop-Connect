/* =========================================================
   DATA SAVER / LOW-END FALLBACK
   ========================================================= */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const dataSaver = navigator.connection && navigator.connection.saveData;
const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
const noWebGL = !window.WebGLRenderingContext;
const STATIC_MODE = prefersReduced || dataSaver || lowMemory || noWebGL || (isMobile && lowCores);

if(STATIC_MODE){
  document.body.classList.add('static-mode');
}

/* =========================================================
   CURSOR MORPH BLOB
   ========================================================= */
(function initCursor(){
  if(STATIC_MODE) return;
  const blob = document.getElementById('cursorBlob');
  if(!blob) return;
  let x=window.innerWidth/2, y=window.innerHeight/2, tx=x, ty=y;
  window.addEventListener('mousemove',(e)=>{tx=e.clientX;ty=e.clientY});
  window.addEventListener('mousedown',()=>blob.classList.add('click'));
  window.addEventListener('mouseup',()=>blob.classList.remove('click'));
  document.querySelectorAll('a,button,.feed-card,.clip,.team-pill,.ticker-card').forEach(el=>{
    el.addEventListener('mouseenter',()=>blob.classList.add('hover'));
    el.addEventListener('mouseleave',()=>blob.classList.remove('hover'));
  });
  function loop(){
    x += (tx-x)*0.15; y += (ty-y)*0.15;
    blob.style.left = x+'px'; blob.style.top = y+'px';
    const t = performance.now()/1000;
    const r1 = 40 + Math.sin(t*1.5)*15;
    const r2 = 60 - Math.sin(t*1.5)*15;
    if(!blob.classList.contains('hover') && !blob.classList.contains('click')){
      blob.style.borderRadius = `${r1}% ${r2}% ${r2}% ${r1}% / ${r1}% ${r1}% ${r2}% ${r2}%`;
    }
    requestAnimationFrame(loop);
  }
  loop();
})();

/* =========================================================
   LOADER
   ========================================================= */
window.addEventListener('load',()=>{
  setTimeout(()=>{
    document.getElementById('loader').classList.add('done');
    runIntro();
    if(!STATIC_MODE) startParticleAssembly();
  },1400);
});

/* =========================================================
   THREE.JS — FULL-PAGE SCENE
   ========================================================= */
let sceneAPI = null;

if(!STATIC_MODE){
(function initScene(){
  const canvas = document.getElementById('sceneCanvas');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf7f5f3);
  scene.fog = new THREE.FogExp2(0xf7f5f3, 0.025);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 8);

  const renderer = new THREE.WebGLRenderer({canvas, antialias:!isMobile, alpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  /* ---------- LIGHTS ---------- */
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
  const royalLight = new THREE.PointLight(0xd62828, 2.2, 25);
  royalLight.position.set(-4, 2, 4);
  scene.add(royalLight);
  const goldLight = new THREE.PointLight(0xff8a00, 2.2, 25);
  goldLight.position.set(4, -2, 4);
  scene.add(goldLight);
  const rimLight = new THREE.PointLight(0xff7a3d, 1.5, 15);
  rimLight.position.set(0, 0, -4);
  scene.add(rimLight);
  const hoopLight = new THREE.PointLight(0xffcf40, 3, 12);
  hoopLight.position.set(0, 0, -8);
  scene.add(hoopLight);

  /* ---------- BASKETBALL (solid, hidden until assembly) ---------- */
  const ballGeo = new THREE.SphereGeometry(1.2, 64, 64);
  const ballMat = new THREE.MeshStandardMaterial({
    color:0xff7a3d, roughness:0.55, metalness:0.15,
    emissive:0x3a1a00, emissiveIntensity:0.3,
    transparent:true, opacity:0
  });
  const ball = new THREE.Mesh(ballGeo, ballMat);
  scene.add(ball);

  const seamMat = new THREE.LineBasicMaterial({color:0x1a0a00, linewidth:2});
  const makeSeam = (points)=>{
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, seamMat);
    line.visible = false;
    ball.add(line);
    return line;
  };
  const circlePoints = (radius, axis, segments=64)=>{
    const pts=[];
    for(let i=0;i<=segments;i++){
      const t = (i/segments)*Math.PI*2;
      if(axis==='xz') pts.push(new THREE.Vector3(Math.cos(t)*radius, 0, Math.sin(t)*radius));
      else if(axis==='yz') pts.push(new THREE.Vector3(0, Math.cos(t)*radius, Math.sin(t)*radius));
      else pts.push(new THREE.Vector3(Math.cos(t)*radius, Math.sin(t)*radius, 0));
    }
    return pts;
  };
  const r = 1.205;
  const seams = [];
  seams.push(makeSeam(circlePoints(r,'xy')));
  seams.push(makeSeam(circlePoints(r,'xz')));
  const curvedSeam = (axis)=>{
    const pts=[];
    for(let i=0;i<=64;i++){
      const t = (i/64)*Math.PI*2;
      const x = Math.cos(t)*r;
      const y = Math.sin(t)*r*0.5;
      const z = Math.sqrt(Math.max(0, r*r - x*x - y*y*0.5));
      pts.push(new THREE.Vector3(x, y, axis==='front'?z:-z));
    }
    return makeSeam(pts);
  };
  seams.push(curvedSeam('front'));
  seams.push(curvedSeam('back'));

  /* ---------- ASSEMBLY PARTICLES (2500) ---------- */
  const ASSEMBLY_COUNT = isMobile ? 800 : 2500;
  const assemblyGeo = new THREE.BufferGeometry();
  const startPositions = new Float32Array(ASSEMBLY_COUNT*3);
  const targetPositions = new Float32Array(ASSEMBLY_COUNT*3);
  const currentPositions = new Float32Array(ASSEMBLY_COUNT*3);
  const assemblyColors = new Float32Array(ASSEMBLY_COUNT*3);

  for(let i=0; i<ASSEMBLY_COUNT; i++){
    // Random start (scattered in space)
    const rStart = 10 + Math.random()*12;
    const thetaStart = Math.random()*Math.PI*2;
    const phiStart = Math.acos(2*Math.random()-1);
    startPositions[i*3] = rStart*Math.sin(phiStart)*Math.cos(thetaStart);
    startPositions[i*3+1] = rStart*Math.sin(phiStart)*Math.sin(thetaStart);
    startPositions[i*3+2] = rStart*Math.cos(phiStart);

    // Target on sphere surface (fibonacci distribution for even spacing)
    const phi = Math.acos(1 - 2*(i+0.5)/ASSEMBLY_COUNT);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const rTarget = 1.22;
    targetPositions[i*3] = rTarget*Math.sin(phi)*Math.cos(theta);
    targetPositions[i*3+1] = rTarget*Math.sin(phi)*Math.sin(theta);
    targetPositions[i*3+2] = rTarget*Math.cos(phi);

    // Start at random position
    currentPositions[i*3] = startPositions[i*3];
    currentPositions[i*3+1] = startPositions[i*3+1];
    currentPositions[i*3+2] = startPositions[i*3+2];

    // Colors: mix of royal blue, gold, and orange
    const mix = Math.random();
    if(mix < 0.4){
      assemblyColors[i*3]=0.84; assemblyColors[i*3+1]=0.16; assemblyColors[i*3+2]=0.16; // royal (red)
    } else if(mix < 0.75){
      assemblyColors[i*3]=1.0; assemblyColors[i*3+1]=0.54; assemblyColors[i*3+2]=0.0; // gold (orange)
    } else {
      assemblyColors[i*3]=1.0; assemblyColors[i*3+1]=0.48; assemblyColors[i*3+2]=0.24; // orange
    }
  }
  assemblyGeo.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
  assemblyGeo.setAttribute('color', new THREE.BufferAttribute(assemblyColors, 3));
  const assemblyMat = new THREE.PointsMaterial({
    size:0.06, vertexColors:true, transparent:true, opacity:1.0,
    blending:THREE.AdditiveBlending, depthWrite:false
  });
  const assemblyParticles = new THREE.Points(assemblyGeo, assemblyMat);
  scene.add(assemblyParticles);

  /* ---------- AMBIENT PARTICLES (500) — always visible ---------- */
  const AMBIENT_COUNT = isMobile ? 150 : 500;
  const ambientGeo = new THREE.BufferGeometry();
  const ambientPos = new Float32Array(AMBIENT_COUNT*3);
  const ambientCol = new Float32Array(AMBIENT_COUNT*3);
  for(let i=0; i<AMBIENT_COUNT; i++){
    ambientPos[i*3] = (Math.random()-0.5)*60;
    ambientPos[i*3+1] = (Math.random()-0.5)*60;
    ambientPos[i*3+2] = (Math.random()-0.5)*60 - 10;
    const mix = Math.random();
    if(mix<0.5){ ambientCol[i*3]=0.9; ambientCol[i*3+1]=0.3; ambientCol[i*3+2]=0.25; }
    else { ambientCol[i*3]=1.0; ambientCol[i*3+1]=0.85; ambientCol[i*3+2]=0.4; }
  }
  ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPos, 3));
  ambientGeo.setAttribute('color', new THREE.BufferAttribute(ambientCol, 3));
  const ambientMat = new THREE.PointsMaterial({
    size:0.05, vertexColors:true, transparent:true, opacity:0.55,
    blending:THREE.AdditiveBlending, depthWrite:false
  });
  const ambientParticles = new THREE.Points(ambientGeo, ambientMat);
  scene.add(ambientParticles);

  /* ---------- LIME HOOP RING ---------- */
  const hoopGeo = new THREE.TorusGeometry(1.6, 0.09, 20, 100);
  const hoopMat = new THREE.MeshStandardMaterial({
    color:0xffcf40, emissive:0xaa6600, emissiveIntensity:0.7,
    metalness:0.4, roughness:0.3
  });
  const hoop = new THREE.Mesh(hoopGeo, hoopMat);
  hoop.position.set(0, 0, -8);
  hoop.rotation.x = Math.PI/2;
  scene.add(hoop);

  // Hoop glow
  const hoopGlowGeo = new THREE.TorusGeometry(1.6, 0.35, 16, 100);
  const hoopGlowMat = new THREE.MeshBasicMaterial({
    color:0xffcf40, transparent:true, opacity:0.18,
    blending:THREE.AdditiveBlending
  });
  const hoopGlow = new THREE.Mesh(hoopGlowGeo, hoopGlowMat);
  hoopGlow.position.copy(hoop.position);
  hoopGlow.rotation.copy(hoop.rotation);
  scene.add(hoopGlow);

  // Inner glow disc
  const hoopDiscGeo = new THREE.CircleGeometry(1.55, 48);
  const hoopDiscMat = new THREE.MeshBasicMaterial({
    color:0xffcf40, transparent:true, opacity:0.08,
    blending:THREE.AdditiveBlending, side:THREE.DoubleSide
  });
  const hoopDisc = new THREE.Mesh(hoopDiscGeo, hoopDiscMat);
  hoopDisc.position.copy(hoop.position);
  scene.add(hoopDisc);

  /* ---------- CAMERA PATH (Catmull-Rom curve) ---------- */
  const cameraPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 8),
    new THREE.Vector3(3.5, 0.6, 6.5),
    new THREE.Vector3(5.5, 1.8, 2.5),
    new THREE.Vector3(3.5, 2.2, -1.5),
    new THREE.Vector3(0, 1.2, -4),
    new THREE.Vector3(0, 0, -8),
    new THREE.Vector3(0, -0.5, -14),
    new THREE.Vector3(0, -1, -22),
  ], false, 'catmullrom', 0.5);

  /* ---------- SCROLL PROGRESS ---------- */
  let scrollProgress = 0;
  let targetScrollProgress = 0;
  const scrollIndicator = document.getElementById('scrollIndicator');

  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      targetScrollProgress = self.progress;
      if(scrollIndicator) scrollIndicator.style.width = (self.progress*100) + '%';
    }
  });

  /* ---------- MOUSE INTERACTION ---------- */
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove',(e)=>{
    mouseX = (e.clientX/window.innerWidth - 0.5)*2;
    mouseY = (e.clientY/window.innerHeight - 0.5)*2;
  });

  /* ---------- RESIZE ---------- */
  window.addEventListener('resize',()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });

  /* ---------- SMOOTHSTEP ---------- */
  function smoothstep(edge0, edge1, x){
    const t = Math.max(0, Math.min(1, (x-edge0)/(edge1-edge0)));
    return t*t*(3-2*t);
  }

  /* ---------- RENDER LOOP ---------- */
  const clock = new THREE.Clock();
  let pageVisible = !document.hidden;
  document.addEventListener('visibilitychange', ()=>{ pageVisible = !document.hidden; });
  function animate(){
    if(!pageVisible){ requestAnimationFrame(animate); return; }
    const t = clock.getElapsedTime();

    // Smooth scroll progress
    scrollProgress += (targetScrollProgress - scrollProgress) * 0.08;

    // Camera position along path
    const pathPos = cameraPath.getPoint(scrollProgress);
    camera.position.copy(pathPos);

    // Camera look-at: blend between blob (origin) and forward along path
    const blobLook = new THREE.Vector3(0, 0, 0);
    const aheadPoint = cameraPath.getPoint(Math.min(scrollProgress + 0.06, 1));
    const lookBlend = smoothstep(0.25, 0.65, scrollProgress);
    const lookTarget = new THREE.Vector3().lerpVectors(blobLook, aheadPoint, lookBlend);
    lookTarget.x += mouseX * 0.3;
    lookTarget.y -= mouseY * 0.3;
    camera.lookAt(lookTarget);

    // Dynamic FOV
    camera.fov = 55 + scrollProgress * 12;
    camera.updateProjectionMatrix();

    // Ball rotation + breathing
    ball.rotation.y = t*0.4 + mouseX*0.3;
    ball.rotation.x = Math.sin(t*0.3)*0.2 + mouseY*0.2;
    const breathe = 1 + Math.sin(t*2)*0.02;
    ball.scale.setScalar(breathe);

    // Hoop rotation
    hoop.rotation.z += 0.008;
    hoopGlow.rotation.z += 0.008;
    hoopGlow.material.opacity = 0.15 + Math.sin(t*2)*0.05;
    hoopDisc.material.opacity = 0.06 + Math.sin(t*2.5)*0.03;

    // Ambient particles drift
    ambientParticles.rotation.y += 0.0004;
    ambientParticles.rotation.x += 0.0002;

    // Lights orbit
    royalLight.position.x = Math.cos(t*0.3)*4;
    royalLight.position.z = Math.sin(t*0.3)*4 + 2;
    goldLight.position.x = Math.cos(t*0.3+Math.PI)*4;
    goldLight.position.z = Math.sin(t*0.3+Math.PI)*4 + 2;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  /* ---------- EXPOSE API ---------- */
  sceneAPI = {
    assemblyParticles, assemblyGeo, startPositions, targetPositions, currentPositions,
    ball, seams, hoop
  };
})();
}

/* =========================================================
   PARTICLE ASSEMBLY ANIMATION
   ========================================================= */
function startParticleAssembly(){
  if(!sceneAPI) return;
  const { assemblyParticles, assemblyGeo, startPositions, targetPositions, currentPositions, ball, seams } = sceneAPI;

  const progress = { value: 0 };

  gsap.to(progress, {
    value: 1,
    duration: 2.8,
    ease: 'power3.inOut',
    onUpdate: () => {
      const p = progress.value;
      const posAttr = assemblyGeo.attributes.position;
      for(let i=0; i<currentPositions.length/3; i++){
        const dx = targetPositions[i*3] - startPositions[i*3];
        const dy = targetPositions[i*3+1] - startPositions[i*3+1];
        const dz = targetPositions[i*3+2] - startPositions[i*3+2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        const delay = (dist/20) * 0.3;
        const localP = Math.max(0, Math.min(1, (p - delay) / (1 - delay)));
        const eased = localP < 0.5 ? 4*localP*localP*localP : 1 - Math.pow(-2*localP+2, 3)/2;

        currentPositions[i*3] = startPositions[i*3] + dx * eased;
        currentPositions[i*3+1] = startPositions[i*3+1] + dy * eased;
        currentPositions[i*3+2] = startPositions[i*3+2] + dz * eased;
      }
      posAttr.needsUpdate = true;
    },
    onComplete: () => {
      gsap.to(assemblyParticles.material, { opacity: 0.2, duration: 1.5, ease:'power2.out' });
      ball.material.opacity = 0;
      ball.visible = true;
      seams.forEach(s => s.visible = true);
      gsap.to(ball.material, { opacity: 1, duration: 1.5, ease:'power2.out' });
    }
  });
}

/* =========================================================
   HERO MORPH DIVIDER
   ========================================================= */
(function initHeroMorph(){
  const path = document.getElementById('heroMorphPath');
  const states = [
    "M0,80 C240,120 480,40 720,80 C960,120 1200,40 1440,80 L1440,140 L0,140 Z",
    "M0,40 C240,20 480,100 720,40 C960,20 1200,100 1440,40 L1440,140 L0,140 Z",
    "M0,100 C240,60 480,120 720,100 C960,60 1200,120 1440,100 L1440,140 L0,140 Z",
    "M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,140 L0,140 Z"
  ];
  let idx = 0;
  setInterval(()=>{
    idx = (idx+1)%states.length;
    gsap.to(path, {attr:{d:states[idx]}, duration:2.5, ease:"power2.inOut"});
  }, 2500);
})();

/* =========================================================
   SECTION MORPH DIVIDERS
   ========================================================= */
(function initSectionMorphs(){
  document.querySelectorAll('[data-morph-section]').forEach((section,i)=>{
    const waves = section.querySelectorAll('.morph-wave');
    if(waves.length===0) return;
    const states = [
      ["M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,160 L0,160 Z",
       "M0,80 C240,40 480,120 720,80 C960,40 1200,120 1440,80 L1440,160 L0,160 Z"],
      ["M0,40 C240,20 480,100 720,40 C960,20 1200,100 1440,40 L1440,160 L0,160 Z",
       "M0,100 C240,120 480,40 720,100 C960,120 1200,40 1440,100 L1440,160 L0,160 Z"],
      ["M0,80 C240,120 480,40 720,80 C960,120 1200,40 1440,80 L1440,160 L0,160 Z",
       "M0,40 C240,20 480,100 720,40 C960,20 1200,100 1440,40 L1440,160 L0,160 Z"],
      ["M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,160 L0,160 Z",
       "M0,100 C240,40 480,120 720,100 C960,40 1200,120 1440,100 L1440,160 L0,160 Z"]
    ];
    const s = states[i % states.length];
    gsap.to(waves[0],{
      scrollTrigger:{trigger:section, start:'top bottom', end:'bottom top', scrub:1},
      attr:{d:s[0]}, ease:'none'
    });
    if(waves[1]){
      gsap.to(waves[1],{
        scrollTrigger:{trigger:section, start:'top bottom', end:'bottom top', scrub:1.5},
        attr:{d:s[1]}, ease:'none'
      });
    }
  });
})();

/* =========================================================
   MORPH HEADLINE
   ========================================================= */
(function initMorphHeadline(){
  const headline = document.getElementById('morphHeadline');
  if(!headline) return;
  const text = headline.textContent.trim();
  headline.textContent = '';
  const words = text.split(' ');
  const charSpans = [];
  words.forEach((word,wi)=>{
    [...word].forEach(ch=>{
      const span = document.createElement('span');
      span.className = 'morph-char';
      span.textContent = ch;
      headline.appendChild(span);
      charSpans.push(span);
    });
    if(wi<words.length-1) headline.appendChild(document.createTextNode(' '));
  });
  charSpans.forEach((span,i)=>{
    gsap.from(span,{
      scrollTrigger:{trigger:headline, start:'top 85%', end:'top 30%', scrub:1},
      rotateX:90, rotateY:(i%2===0?-45:45), scale:0.3, opacity:0, color:'#1e6bff', ease:'power2.out'
    });
    gsap.to(span,{
      scrollTrigger:{trigger:headline, start:'top 10%', end:'top -40%', scrub:1},
      rotateX:-30, y:-20, scale:1.1, color:'#ffb800', ease:'power2.in'
    });
  });
  charSpans.forEach((ch,i)=>{
    gsap.to(ch,{
      y:Math.sin(i)*6, duration:1.5+Math.random()*0.5, repeat:-1, yoyo:true,
      ease:'sine.inOut', delay:i*0.05
    });
  });
})();

/* =========================================================
   HERO TEXT SPLIT & INTRO
   ========================================================= */
function runIntro(){
  const title = document.getElementById('heroTitle');
  const words = title.querySelectorAll('.word');
  words.forEach(word=>{
    const text = word.textContent;
    word.textContent = '';
    [...text].forEach(ch=>{
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      word.appendChild(span);
    });
  });
  const tl = gsap.timeline();
  tl.from('.eyebrow',{y:30,opacity:0,duration:0.8,ease:'power3.out'})
    .from('#heroTitle .char',{y:120,opacity:0,rotateX:-90,duration:0.9,stagger:0.03,ease:'back.out(1.7)'},'-=0.4')
    .from('.hero p.subtitle',{y:30,opacity:0,duration:0.8,ease:'power3.out'},'-=0.5')
    .from('.cta-outline',{y:30,opacity:0,duration:0.8,ease:'power3.out'},'-=0.5')
    .from('.top-bar > *',{y:-30,opacity:0,duration:0.5,stagger:0.08,ease:'power3.out'},0)
    .from('.nav-bar > *',{y:30,opacity:0,duration:0.5,stagger:0.08,ease:'power3.out'},0.2)
    .from('.ticker-card, .ticker-upcoming',{x:-40,opacity:0,duration:0.6,stagger:0.1,ease:'power3.out'},0.4);
}

/* =========================================================
   SCROLL REVEAL
   ========================================================= */
gsap.registerPlugin(ScrollTrigger);
document.querySelectorAll('.reveal').forEach((el,i)=>{
  gsap.from(el,{
    scrollTrigger:{trigger:el, start:'top 85%', toggleActions:'play none none none'},
    y:60, opacity:0, duration:0.6, delay:i%4*0.05, ease:'power3.out'
  });
});
gsap.utils.toArray('.section-head').forEach(head=>{
  gsap.from(head.children,{
    scrollTrigger:{trigger:head, start:'top 85%'},
    y:40, opacity:0, duration:0.8, stagger:0.15, ease:'power3.out'
  });
});
gsap.from('#standingsBody tr',{
  scrollTrigger:{trigger:'.standings', start:'top 80%'},
  x:-30, opacity:0, duration:0.5, stagger:0.07, ease:'power3.out'
});

/* =========================================================
   3D TILT
   ========================================================= */
document.querySelectorAll('.tilt3d').forEach(card=>{
  let targetRx = 0, targetRy = 0, curRx = 0, curRy = 0, raf = null;
  function render(){
    curRx += (targetRx - curRx) * 0.14;
    curRy += (targetRy - curRy) * 0.14;
    card.style.transform = `perspective(1000px) rotateX(${curRx}deg) rotateY(${curRy}deg) translateZ(0)`;
    if(Math.abs(targetRx-curRx) > 0.02 || Math.abs(targetRy-curRy) > 0.02){
      raf = requestAnimationFrame(render);
    } else {
      raf = null;
    }
  }
  function kick(){ if(!raf) raf = requestAnimationFrame(render); }
  card.addEventListener('mousemove',(e)=>{
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width/2;
    const cy = rect.height/2;
    targetRx = ((y-cy)/cy)*-6;
    targetRy = ((x-cx)/cx)*6;
    kick();
  });
  card.addEventListener('mouseleave',()=>{
    targetRx = 0; targetRy = 0;
    kick();
  });
});

/* =========================================================
   MAGNETIC BUTTONS
   ========================================================= */
document.querySelectorAll('.magnetic').forEach(btn=>{
  btn.addEventListener('mousemove',(e)=>{
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width/2;
    const y = e.clientY - rect.top - rect.height/2;
    gsap.to(btn,{x:x*0.3, y:y*0.3, duration:0.4, ease:'power3.out'});
  });
  btn.addEventListener('mouseleave',()=>{
    gsap.to(btn,{x:0, y:0, duration:0.6, ease:'elastic.out(1,0.4)'});
  });
});

/* =========================================================
   LIVE SCORES
   ========================================================= */
setInterval(()=>{
  const els = document.querySelectorAll('.score[data-team]');
  if(!els.length) return;
  const el = els[Math.floor(Math.random()*els.length)];
  const cur = parseInt(el.textContent,10);
  if(isNaN(cur)) return;
  const add = Math.random()>0.5 ? 2 : 3;
  const target = cur + add;
  gsap.to(el,{
    duration:0.4,
    onUpdate:function(){ el.textContent = Math.round(cur + (target-cur)*this.progress()); },
    onStart:()=>el.classList.add('flash'),
    onComplete:()=>el.classList.remove('flash')
  });
},8000);

/* =========================================================
   FEED TABS
   ========================================================= */
const tabs = document.querySelectorAll('#feedTabs button');
const cards = document.querySelectorAll('#feedGrid .feed-card');
tabs.forEach(btn=>{
  btn.addEventListener('click',()=>{
    tabs.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    cards.forEach(c=>{
      if(f==='all' || c.dataset.cat===f){
        c.style.display='';
        gsap.fromTo(c,{opacity:0, scale:0.9, y:20, clipPath:'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)'},
          {opacity:1, scale:1, y:0, clipPath:'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration:0.7, ease:'power3.out'});
      } else {
        gsap.to(c,{opacity:0, scale:0.9, duration:0.3, onComplete:()=>{c.style.display='none'}});
      }
    });
  });
});

/* =========================================================
   CLIPS MORPH REVEAL
   ========================================================= */
gsap.from('.clip',{
  scrollTrigger:{trigger:'.clips-grid', start:'top 80%'},
  scale:0.8, opacity:0, rotate:5, duration:0.7, stagger:0.08, ease:'back.out(1.4)',
  clipPath:'circle(0% at 50% 50%)',
  onComplete:function(){ document.querySelectorAll('.clip').forEach(c=>{c.style.clipPath=''}); }
});
/* =========================================================
   HERO PARALLAX
   ========================================================= */
gsap.to('.hero-content',{
  scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:true},
  y:100, opacity:0.3, ease:'none'
});
