// product-scene.jsx — Three.js scene for the MANETTE product page.
// Cinematic scroll choreography: zoom-ins, exploded view, X-ray pass.

(function () {
  function whenThreeReady(cb) {
    if (window.THREE && window.GLTFLoader) return cb();
    window.addEventListener('three-ready', () => cb(), { once: true });
  }

  function ProductScene({ accent = '#C8FF3C', motionFactor = 1, dark = true, onProgress }) {
    const wrapRef = React.useRef(null);
    const stateRef = React.useRef({
      progress: 0,
      pointer: { x: 0, y: 0 },
      target: { x: 0, y: 0 },
    });

    React.useEffect(() => {
      const wrap = wrapRef.current;
      if (!wrap) return;

      let cleanup = () => {};
      whenThreeReady(() => {
        const THREE = window.THREE;
        const GLTFLoader = window.GLTFLoader;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
        const camBase = new THREE.Vector3(0, 0, 3.6);
        camera.position.copy(camBase);

        const renderer = new THREE.WebGLRenderer({
          antialias: true, alpha: true, powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        wrap.appendChild(renderer.domElement);
        renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.35));
        const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2.5, 3, 4); scene.add(key);
        const rim = new THREE.DirectionalLight(0xffffff, 1.4); rim.position.set(-3, 1.5, -2); scene.add(rim);
        // Procedural studio environment for proper PBR reflections
        if (THREE.PMREMGenerator) {
          try {
            const pmrem = new THREE.PMREMGenerator(renderer);
            const envScene = new THREE.Scene();
            const grad = (() => {
              const c = document.createElement('canvas');
              c.width = 256; c.height = 256;
              const g = c.getContext('2d');
              const lg = g.createLinearGradient(0, 0, 0, 256);
              lg.addColorStop(0, '#1a1a26');
              lg.addColorStop(0.5, '#0a0a14');
              lg.addColorStop(1, '#000');
              g.fillStyle = lg; g.fillRect(0, 0, 256, 256);
              g.fillStyle = '#ffffff'; g.globalAlpha = 0.5;
              g.fillRect(40, 60, 6, 140); g.fillRect(210, 80, 6, 100);
              const tex = new THREE.CanvasTexture(c);
              tex.mapping = THREE.EquirectangularReflectionMapping;
              return tex;
            })();
            scene.environment = pmrem.fromEquirectangular(grad).texture;
          } catch (e) { /* skip env */ }
        }
        const accentLight = new THREE.PointLight(new THREE.Color(accent), 1.6, 8, 1.4);
        accentLight.position.set(-1.5, -0.5, 2);
        scene.add(accentLight);

        const holder = new THREE.Group();
        scene.add(holder);

        let model = null;
        // Listen to finish swap events from the configurateur
        let finishTint = null;
        const FINISH_COLORS = {
          graphite: 0x1a1a20, ivoire: 0xe8e2d2, plomb: 0x5a5d63, lime: 0xc8ff3c,
        };
        window.addEventListener('mn-finish', (e) => {
          finishTint = FINISH_COLORS[e.detail] ?? null;
          parts.forEach(pt => {
            if (pt.origMat && pt.origMat.color && finishTint != null) {
              if (!pt.baseColor) pt.baseColor = pt.origMat.color.clone();
              pt.origMat.color.setHex(finishTint).lerp(pt.baseColor, 0.15);
              if (pt.origMat.metalness !== undefined) {
                pt.origMat.metalness = e.detail === 'plomb' ? 0.7 : 0.25;
                pt.origMat.roughness = e.detail === 'ivoire' ? 0.55 : 0.35;
              }
            }
          });
        });

        // Per-mesh data captured at load time so we can explode and X-ray.
        // Each entry: { mesh, basePos (Vector3), explodeDir (Vector3), origMat, xrayMat, wireMesh }
        const parts = [];
        let bbCenter = new THREE.Vector3();
        let bbSize = 1;

        const loader = new GLTFLoader();
        if (window.DRACOLoader) {
          const draco = new window.DRACOLoader();
          draco.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
          draco.setDecoderConfig({ type: 'js' });
          loader.setDRACOLoader(draco);
        }
        if (window.MeshoptDecoder) loader.setMeshoptDecoder(window.MeshoptDecoder);

        loader.load(
          'assets/manette.glb',
          (gltf) => {
            model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            model.position.sub(center);
            const target = 1.6;
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            model.scale.setScalar(target / maxDim);
            holder.add(model);

            // Recompute bounds in scene-space after centering
            const box2 = new THREE.Box3().setFromObject(holder);
            box2.getCenter(bbCenter);
            bbSize = Math.max(...box2.getSize(new THREE.Vector3()).toArray());

            // Walk meshes — capture base local position, build explode vector
            // and a sibling wireframe mesh for the X-ray pass.
            model.updateMatrixWorld(true);
            model.traverse((o) => {
              if (!o.isMesh) return;
              if (o.material && o.material.metalness !== undefined) {
                o.material.envMapIntensity = 1.2;
              }

              // World position of mesh center → direction from holder center
              const worldPos = new THREE.Vector3();
              o.getWorldPosition(worldPos);
              const dir = worldPos.clone().sub(bbCenter);
              if (dir.length() < 0.001) {
                dir.set((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5));
              }
              dir.normalize();
              // Convert world-direction to parent-local for translation
              const parent = o.parent;
              const inv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
              const dirLocal = dir.clone().transformDirection(inv);

              // X-ray duplicate material (translucent + emissive accent)
              const xrayMat = new THREE.MeshStandardMaterial({
                color: 0x1a1a22,
                transparent: true,
                opacity: 0.0,            // ramped via xray amount
                emissive: new THREE.Color(accent),
                emissiveIntensity: 0.15,
                metalness: 0.1,
                roughness: 0.6,
                depthWrite: false,
              });

              // Wireframe overlay sibling
              let wireMesh = null;
              try {
                const wireGeo = new THREE.WireframeGeometry(o.geometry);
                const wireMat = new THREE.LineBasicMaterial({
                  color: new THREE.Color(accent),
                  transparent: true,
                  opacity: 0.0,
                  depthTest: true,
                  depthWrite: false,
                });
                wireMesh = new THREE.LineSegments(wireGeo, wireMat);
                wireMesh.position.copy(o.position);
                wireMesh.rotation.copy(o.rotation);
                wireMesh.scale.copy(o.scale);
                wireMesh.renderOrder = 2;
                o.parent.add(wireMesh);
              } catch (e) { /* skip if non-mesh */ }

              parts.push({
                mesh: o,
                basePos: o.position.clone(),
                explodeDir: dirLocal,
                origMat: o.material,
                xrayMat,
                wireMesh,
              });
            });
          },
          undefined,
          (err) => {
            console.warn('GLB load error', err);
            const geo = new THREE.IcosahedronGeometry(0.6, 1);
            const mat = new THREE.MeshStandardMaterial({
              color: 0x222229, metalness: 0.4, roughness: 0.35,
              emissive: new THREE.Color(accent), emissiveIntensity: 0.05,
            });
            model = new THREE.Mesh(geo, mat);
            holder.add(model);
          },
        );

        // Pointer parallax
        const onMove = (e) => {
          const r = renderer.domElement.getBoundingClientRect();
          stateRef.current.target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
          stateRef.current.target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
        };
        window.addEventListener('mousemove', onMove);

        const resize = () => {
          const r = wrap.getBoundingClientRect();
          renderer.setSize(r.width, r.height, false);
          camera.aspect = r.width / r.height;
          camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(wrap);

        // ── Cinematic keyframes ────────────────────────────────────────────
        // Each key adds: camZ (camera dolly), camX/camY (camera offset for off-
        // centre framing), fov, explode (0..1), xray (0..1).
        // The choreography:
        //   0.00 hero      — full body, slight angle
        //   0.16 settle    — close to face-on
        //   0.30 ZOOM gâchette — camera dives into right shoulder/trigger
        //   0.46 EXPLODÉE  — parts fly apart, top-down
        //   0.62 X-RAY     — translucent + wireframe glow
        //   0.78 ZOOM pavé — camera close, low angle on touchpad
        //   0.92 recompose — full body, hero scale
        //   1.00 order     — settle into card
        // Cle 'lock' (0|1) : quand 1, la rotation drift + parallax pointeur est
        // ramenee a ~0 pour que la manette reste rigoureusement de face.
        // Mapping section -> p (mesure sur la page reelle) :
        //   00 Hero          : 0.000 - 0.145
        //   02 Objet         : 0.145 - 0.290
        //   03 Matiere       : 0.290 - 0.435  <- LOCK face-on demande par l'utilisateur
        //   04 Capteurs      : 0.435 - 0.580
        //   05 Geste         : 0.580 - 0.725
        //   06 Specs/07 Order: 0.725 - 1.000
        const KEYS = [
          { p:0.00, ry: 0.55, rx:-0.22, sc:1.00, x: 0.00, y: 0.00, camZ:3.60, camX: 0.00, camY: 0.00, fov:32, explode:0, xray:0, lock:0 },
          { p:0.10, ry: 0.10, rx:-0.05, sc:1.05, x: 0.00, y:-0.02, camZ:3.50, camX: 0.00, camY: 0.00, fov:30, explode:0, xray:0, lock:0 },
          // Section 02 — Objet : zoom gachette
          { p:0.22, ry:-0.55, rx:-0.20, sc:1.20, x:-0.05, y: 0.00, camZ:1.80, camX: 0.45, camY: 0.05, fov:34, explode:0, xray:0, lock:0 },
          // Transition vers Matiere
          { p:0.28, ry:-0.25, rx:-0.08, sc:1.10, x: 0.00, y: 0.00, camZ:2.50, camX: 0.18, camY: 0.08, fov:34, explode:0, xray:0, lock:0 },
          // Section 03 — Matiere : entree face-on, lock active
          { p:0.32, ry: 0.00, rx: 0.00, sc:1.05, x: 0.00, y: 0.00, camZ:2.90, camX: 0.05, camY: 0.05, fov:34, explode:0.15, xray:0, lock:1 },
          // Section 03 — Matiere : vue eclatee, toujours face-on
          { p:0.38, ry: 0.00, rx: 0.00, sc:0.95, x: 0.00, y: 0.00, camZ:3.20, camX: 0.00, camY: 0.10, fov:36, explode:1, xray:0, lock:1 },
          // Section 03 — Matiere : sortie, encore face-on
          { p:0.43, ry: 0.00, rx: 0.00, sc:1.00, x: 0.00, y: 0.00, camZ:3.30, camX: 0.00, camY: 0.05, fov:34, explode:0.5, xray:0.2, lock:1 },
          // Section 04 — Capteurs : reprise rotation + xray
          { p:0.50, ry:-0.50, rx: 0.05, sc:1.05, x: 0.00, y: 0.00, camZ:3.30, camX: 0.00, camY: 0.00, fov:32, explode:0, xray:0.7, lock:0 },
          { p:0.56, ry:-0.85, rx:-0.05, sc:1.05, x: 0.00, y: 0.00, camZ:3.10, camX: 0.00, camY: 0.00, fov:30, explode:0, xray:1, lock:0 },
          // Section 05 — Geste : gros plan pave tactile
          { p:0.65, ry:-1.30, rx:-0.45, sc:1.25, x: 0.00, y:-0.10, camZ:1.90, camX: 0.00, camY:-0.30, fov:36, explode:0, xray:0.2, lock:0 },
          { p:0.72, ry:-1.55, rx:-0.10, sc:1.10, x: 0.00, y: 0.00, camZ:2.80, camX: 0.00, camY: 0.00, fov:32, explode:0, xray:0, lock:0 },
          // Sections 06/07 — Specs + Commander
          { p:0.85, ry:-2.00, rx: 0.00, sc:1.15, x: 0.00, y: 0.00, camZ:3.20, camX: 0.00, camY: 0.00, fov:32, explode:0, xray:0, lock:0 },
          { p:1.00, ry:-2.50, rx:-0.10, sc:0.85, x: 0.00, y:-0.18, camZ:3.80, camX: 0.00, camY:-0.10, fov:30, explode:0, xray:0, lock:0 },
        ];
        const lerp = (a, b, t) => a + (b - a) * t;
        const easeInOut = (t) => t * t * (3 - 2 * t);
        const sample = (p) => {
          for (let i = 0; i < KEYS.length - 1; i++) {
            const a = KEYS[i], b = KEYS[i + 1];
            if (p >= a.p && p <= b.p) {
              const t = easeInOut((p - a.p) / (b.p - a.p));
              const out = {};
              for (const k of Object.keys(a)) out[k] = lerp(a[k], b[k], t);
              return out;
            }
          }
          return KEYS[KEYS.length - 1];
        };

        // Smooth state we lerp toward each frame (avoid pops at scroll deltas)
        const smooth = {
          ry:0, rx:0, sc:1, x:0, y:0,
          camZ:3.6, camX:0, camY:0, fov:32, explode:0, xray:0, lock:0,
        };

        let frameTime = performance.now();
        let raf = 0;
        const loop = () => {
          raf = requestAnimationFrame(loop);
          const now = performance.now();
          frameTime = now;

          const s = stateRef.current;
          s.pointer.x += (s.target.x - s.pointer.x) * 0.06;
          s.pointer.y += (s.target.y - s.pointer.y) * 0.06;

          const k = sample(Math.max(0, Math.min(1, s.progress)));
          const a = 0.12;
          for (const prop of Object.keys(smooth)) {
            smooth[prop] += (k[prop] - smooth[prop]) * a;
          }

          if (model) {
            const drift = (now / 1000) * 0.15 * motionFactor;
            // lock (0..1) ramene le drift et la parallax pointeur a zero quand
            // une section verrouille la rotation (ex: section 03 face-on).
            const freeMotion = 1 - smooth.lock;
            holder.rotation.y = smooth.ry + (drift * 0.2 + s.pointer.x * 0.3) * freeMotion;
            holder.rotation.x = smooth.rx + s.pointer.y * 0.18 * freeMotion;
            const sc = smooth.sc * (1 + Math.sin(now / 1800) * 0.005 * motionFactor);
            holder.scale.setScalar(sc);
            holder.position.x = smooth.x;
            holder.position.y = smooth.y + Math.sin(now / 1400) * 0.015 * motionFactor;

            // Per-part: explode + xray material crossfade
            const exAmt = smooth.explode;
            const xrAmt = smooth.xray;
            const exDistance = 0.55;
            for (const pt of parts) {
              // Explode — translate along outward direction
              pt.mesh.position.copy(pt.basePos).addScaledVector(pt.explodeDir, exAmt * exDistance);
              if (pt.wireMesh) {
                pt.wireMesh.position.copy(pt.mesh.position);
                pt.wireMesh.rotation.copy(pt.mesh.rotation);
                pt.wireMesh.scale.copy(pt.mesh.scale);
                pt.wireMesh.material.opacity = xrAmt * 0.85;
                pt.wireMesh.material.color.set(accent);
              }
              // X-ray crossfade: at xrAmt=1, swap to xray material with alpha
              if (xrAmt > 0.02) {
                if (pt.mesh.material !== pt.xrayMat) pt.mesh.material = pt.xrayMat;
                pt.xrayMat.opacity = (1 - xrAmt) * 0.6 + (1 - xrAmt) * 0;
                // make truly translucent at full xray
                pt.xrayMat.opacity = lerp(0.85, 0.18, xrAmt);
                pt.xrayMat.emissive.set(accent);
                pt.xrayMat.emissiveIntensity = lerp(0.05, 0.3, xrAmt);
              } else {
                if (pt.mesh.material !== pt.origMat) pt.mesh.material = pt.origMat;
              }
            }
          }

          // Camera dolly
          camera.position.x = smooth.camX;
          camera.position.y = smooth.camY;
          camera.position.z = smooth.camZ;
          if (Math.abs(camera.fov - smooth.fov) > 0.05) {
            camera.fov = smooth.fov;
            camera.updateProjectionMatrix();
          }
          camera.lookAt(0, 0, 0);

          accentLight.color.set(accent);
          renderer.render(scene, camera);
        };
        loop();

        const onScroll = () => {
          const doc = document.documentElement;
          const total = doc.scrollHeight - window.innerHeight;
          const p = total > 0 ? window.scrollY / total : 0;
          stateRef.current.progress = p;
          if (onProgress) onProgress(p);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        cleanup = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('scroll', onScroll);
          ro.disconnect();
          renderer.dispose();
          if (renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          }
          scene.traverse((o) => {
            if (o.isMesh || o.isLineSegments) {
              if (o.geometry) o.geometry.dispose();
              if (o.material) {
                if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
                else o.material.dispose();
              }
            }
          });
        };
      });

      return () => cleanup();
    }, [accent, motionFactor, dark, onProgress]);

    return <div ref={wrapRef} className="scene-wrap" />;
  }

  Object.assign(window, { ProductScene });
})();
