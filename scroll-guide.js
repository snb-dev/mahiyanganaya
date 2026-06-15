(() => {
  if (window.matchMedia('(hover: none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const W = 200, H = 200;
  let mouseX = -400, mouseY = -400;
  let curX   = -400, curY   = -400;
  let isOver = false;

  const mount = document.createElement('div');
  mount.id = 'scroll-guide';
  mount.setAttribute('aria-hidden', 'true');
  document.body.appendChild(mount);

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!isOver) {
      isOver = true;
      if (mount.classList.contains('is-ready')) mount.style.opacity = '1';
    }
  });
  document.addEventListener('mouseleave', () => {
    isOver = false;
    mount.style.opacity = '0';
  });

  // ── Script loader ──────────────────────────────────────────────────────
  const loadScript = src =>
    new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });

  // ── Init ───────────────────────────────────────────────────────────────
  const init = () => {
    const THREE = window.THREE;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputEncoding      = THREE.sRGBEncoding;
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 100);
    camera.position.set(0, 1.2, 5.5);
    camera.lookAt(0, 0.3, 0);

    scene.add(new THREE.AmbientLight(0xfff0e8, 0.55));
    const key = new THREE.DirectionalLight(0xffe5b0, 1.8);
    key.position.set(4, 7, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8ddf0, 0.65);
    fill.position.set(-4, 2, 3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.9);
    rim.position.set(0, 3, -6);
    scene.add(rim);

    // ── Paint helper ───────────────────────────────────────────────────
    const paintModel = (model, { roughness = 0.55, metalness = 0 } = {}) => {
      model.traverse(child => {
        if (!child.isMesh || !child.material) return;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(mat => {
          if ('roughness' in mat) { mat.roughness = roughness; mat.metalness = metalness; }
          mat.needsUpdate = true;
        });
      });
    };

    // ── Peacock group ──────────────────────────────────────────────────
    const peacockGrp = new THREE.Group();
    scene.add(peacockGrp);
    peacockGrp.scale.setScalar(0);

    let peacockMixer = null;

    const onReady = () => {
      scaleTween(peacockGrp, 0, 1, 0.5);
      document.body.classList.add('custom-cursor');
      mount.classList.add('is-ready');
      if (isOver) mount.style.opacity = '1';
    };

    // ── Load Parrot.glb ────────────────────────────────────────────────
    const loader = new THREE.GLTFLoader();
    loader.load(
      'https://threejs.org/examples/models/gltf/Parrot.glb',
      gltf => {
        const model = gltf.scene;
        model.scale.setScalar(0.015);
        model.rotation.y = -0.4;
        model.position.y = -0.15;
        paintModel(model, { roughness: 0.55, metalness: 0 });
        peacockGrp.add(model);
        if (gltf.animations.length) {
          peacockMixer = new THREE.AnimationMixer(model);
          peacockMixer.clipAction(gltf.animations[0]).play();
        }
        onReady();
      },
      undefined,
      () => {
        // Fallback simple bird if CDN fails
        const g = new THREE.Group();
        const gm = new THREE.MeshStandardMaterial({ color: 0x2f7a3c, roughness: 0.6, metalness: 0 });
        const bm = new THREE.MeshStandardMaterial({ color: 0x3fa0b0, roughness: 0.5, metalness: 0 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 7, 5), gm);
        body.scale.set(1, 0.68, 1.3); g.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 7, 5), gm);
        head.position.set(0, 0.35, 0.42); g.add(head);
        [-1, 1].forEach(s => {
          const w = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.06, 0.38), bm);
          w.position.set(s * 0.5, 0.05, -0.05); w.rotation.z = s * 0.25; g.add(w);
        });
        g.scale.setScalar(1.5);
        peacockGrp.add(g);
        onReady();
      }
    );

    // ── Scale tween ────────────────────────────────────────────────────
    const tweens = [];
    const scaleTween = (obj, from, to, dur) => {
      for (let i = tweens.length - 1; i >= 0; i--) {
        if (tweens[i].obj === obj) tweens.splice(i, 1);
      }
      tweens.push({ obj, from, to, dur, elapsed: 0 });
    };
    const updateTweens = dt => {
      for (let i = tweens.length - 1; i >= 0; i--) {
        const tw = tweens[i];
        tw.elapsed += dt;
        const p = Math.min(tw.elapsed / tw.dur, 1);
        const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        tw.obj.scale.setScalar(tw.from + (tw.to - tw.from) * e);
        if (p >= 1) tweens.splice(i, 1);
      }
    };

    // ── Render loop ────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let t = 0;
    const LERP = 0.14;

    const tick = () => {
      requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      t += dt;

      curX += (mouseX - curX) * LERP;
      curY += (mouseY - curY) * LERP;
      mount.style.transform = `translate(${curX - W / 2}px,${curY - H / 2}px)`;

      if (peacockMixer) peacockMixer.update(dt);
      updateTweens(dt);

      // Idle: gentle bob + sway
      if (peacockGrp.scale.x > 0.05) {
        peacockGrp.position.y = Math.sin(t * 1.4) * 0.08;
        peacockGrp.rotation.y = Math.sin(t * 0.7) * 0.18;
      }

      renderer.render(scene, camera);
    };
    tick();
  };

  // ── Bootstrap ──────────────────────────────────────────────────────────
  const bootstrap = () => {
    loadScript('https://cdn.jsdelivr.net/npm/three@0.134.0/build/three.min.js')
      .then(() => loadScript('https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/loaders/GLTFLoader.js'))
      .then(init)
      .catch(err => { mount.remove(); console.warn('scroll-guide:', err); });
  };

  if (document.readyState === 'complete') {
    setTimeout(bootstrap, 800);
  } else {
    window.addEventListener('load', () => setTimeout(bootstrap, 800));
  }
})();
