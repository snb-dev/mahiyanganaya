(() => {
  const container = document.getElementById("terrain-3d");
  if (!container) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const loadThree = () =>
    new Promise((resolve, reject) => {
      if (window.THREE) { resolve(window.THREE); return; }
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.min.js";
      s.onload = () => (window.THREE ? resolve(window.THREE) : reject(new Error("THREE not defined")));
      s.onerror = reject;
      document.head.appendChild(s);
    });

  const heightAt = (x, z) => {
    let h =
      2.0 * Math.sin(x * 0.22) * Math.cos(z * 0.27) +
      1.1 * Math.sin(x * 0.48 + 1.3) * Math.sin(z * 0.41 + 0.6) +
      0.5 * Math.sin(x * 0.9 + 2.1) * Math.cos(z * 0.8 + 1.7) +
      1.6;
    const riverPath = Math.sin(x * 0.14) * 5;
    const dist = Math.abs(z - riverPath);
    h -= 3.4 * Math.exp(-(dist * dist) / 14);
    return h;
  };

  const init = (THREE) => {
    const W = container.offsetWidth || 600;
    const H = 340;
    const WATER = -0.55;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = H + "px";
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 200);
    camera.position.set(0, 16, 26);
    camera.lookAt(0, -1, 0);

    scene.add(new THREE.HemisphereLight(0xfffaf0, 0x2f6f59, 1.0));
    const sun = new THREE.DirectionalLight(0xffe9c4, 1.2);
    sun.position.set(18, 24, 10);
    scene.add(sun);

    const group = new THREE.Group();
    scene.add(group);

    // Terrain mesh
    const geo = new THREE.PlaneGeometry(44, 44, 80, 80);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cSand  = new THREE.Color(0xd9c49b);
    const cGrass = new THREE.Color(0x2f6f59);
    const cRidge = new THREE.Color(0x52a47e);
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const h = heightAt(pos.getX(i), pos.getZ(i));
      pos.setY(i, h);
      if (h < WATER + 0.6) {
        tmp.copy(cSand);
      } else if (h > 3.5) {
        tmp.copy(cRidge);
      } else {
        tmp.lerpColors(cGrass, cRidge, (h - WATER) / 6);
      }
      colors[i * 3]     = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    group.add(new THREE.Mesh(
      geo,
      new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })
    ));

    // River plane
    const waterGeo = new THREE.PlaneGeometry(44, 44);
    waterGeo.rotateX(-Math.PI / 2);
    group.add(new THREE.Mesh(
      waterGeo,
      new THREE.MeshLambertMaterial({ color: 0x3fa0b0, transparent: true, opacity: 0.72 })
    ));
    group.children[1].position.y = WATER;

    group.rotation.y = -0.4;

    if (prefersReducedMotion) {
      renderer.render(scene, camera);
      return;
    }

    let active = true;
    const obs = new IntersectionObserver(
      (entries) => { active = entries.some((e) => e.isIntersecting); }
    );
    obs.observe(container);

    const tick = () => {
      requestAnimationFrame(tick);
      if (!active) return;
      group.rotation.y += 0.0012;
      renderer.render(scene, camera);
    };
    tick();

    window.addEventListener("resize", () => {
      const w = container.offsetWidth || W;
      camera.aspect = w / H;
      camera.updateProjectionMatrix();
      renderer.setSize(w, H);
    });
  };

  // Load Three.js when About section is near the viewport.
  // rootMargin is generous so it pre-loads before the user sees it.
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      loadThree()
        .then(init)
        .catch((err) => {
          // On failure, leave the sand placeholder – never hide it.
          console.warn("terrain: Three.js unavailable", err);
        });
    },
    { rootMargin: "400px" }
  );

  // IntersectionObserver is universal on all target browsers; fall back silently if not.
  if ("IntersectionObserver" in window && window.innerWidth >= 700) {
    observer.observe(container);
  } else if (window.innerWidth >= 700) {
    // Old browser with no IO – try loading anyway
    loadThree().then(init).catch(() => {});
  }
  // Under 700 px: CSS already hides .terrain-figure; do nothing.
})();
