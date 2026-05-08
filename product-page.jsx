// product-page.jsx — MANETTE product page sections, scroll-driven.
// The 3D scene is fixed full-screen behind; sections are transparent panels
// with copy that comes in/out as scroll progress passes their range.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#C8FF3C",
  "fontPair": "grotesk",
  "dark": true,
  "motion": 60,
  "headline": "MANETTE",
  "tagline": "Une pièce. Mille gestes."
}/*EDITMODE-END*/;

const FONT_PAIRS = {
  grotesk: { display: '"Space Grotesk", sans-serif', body: '"Space Grotesk", sans-serif', mono: '"JetBrains Mono", monospace', label: 'Grotesk' },
  display: { display: '"Big Shoulders Display", sans-serif', body: '"Inter Tight", sans-serif', mono: '"JetBrains Mono", monospace', label: 'Display' },
  serif:   { display: '"Fraunces", serif', body: '"Inter Tight", sans-serif', mono: '"JetBrains Mono", monospace', label: 'Serif' },
  classic: { display: '"Inter Tight", sans-serif', body: '"Inter Tight", sans-serif', mono: '"IBM Plex Mono", monospace', label: 'Classique' },
};

// Hook: returns 0→1 progress through a vertical range of the document.
function useScrollRange(refStart, refEnd) {
  const [p, setP] = React.useState(0);
  React.useEffect(() => {
    const update = () => {
      const start = refStart.current, end = refEnd.current;
      if (!start || !end) return;
      const sy = window.scrollY;
      const sTop = start.getBoundingClientRect().top + sy;
      const eTop = end.getBoundingClientRect().top + sy;
      const span = Math.max(1, eTop - sTop);
      const v = (sy - sTop + window.innerHeight * 0.4) / span;
      setP(Math.max(0, Math.min(1, v)));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [refStart, refEnd]);
  return p;
}

// Topbar — minimal, fades in shadow on scroll
function ProductTopbar({ accent, scrolled }) {
  return (
    <header className={`p-topbar ${scrolled ? 'scrolled' : ''}`}>
      <a href="#" className="p-brand">
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="2.6" fill={accent} />
        </svg>
        <span>MANETTE</span>
      </a>
      <nav className="p-nav">
        <a href="#objet">Objet</a>
        <a href="#matiere">Matière</a>
        <a href="#capteurs">Capteurs</a>
        <a href="#geste">Geste</a>
        <a href="#caracteristiques">Caractéristiques</a>
      </nav>
      <div className="p-actions">
        <a href="#commander" className="p-cta" style={{ borderColor: accent, color: accent }}>
          Précommander
        </a>
      </div>
    </header>
  );
}

// Hero — wordmark, headline, scroll hint
function HeroProduct({ accent, headline, tagline }) {
  return (
    <section className="p-hero" data-screen-label="01 Hero">
      <div className="p-hero-meta mono">
        <span>MNT—01</span>
        <span>SÉRIE / PARIS / 2026</span>
        <span style={{ color: accent }}>● disponible automne</span>
      </div>
      <h1 className="p-hero-h">{headline}</h1>
      <p className="p-hero-t">{tagline}</p>
      <div className="p-hero-foot mono">
        <span>↓</span>
        <span>Tournez la page pour faire tourner la manette</span>
      </div>
    </section>
  );
}

// Sticky scene anchor — full viewport gap; the scene stays behind, copy floats above
function SceneSection({ id, label, kicker, title, body, accent, side = 'right', stats }) {
  return (
    <section className="p-scene-sec" id={id} data-screen-label={label}>
      <div className={`p-panel p-panel-${side}`}>
        <div className="p-panel-kicker mono">
          <span style={{ color: accent }}>—</span> {kicker}
        </div>
        <h2 className="p-panel-h">{title}</h2>
        <p className="p-panel-t">{body}</p>
        {stats && (
          <ul className="p-stats mono">
            {stats.map(s => (
              <li key={s.l}>
                <div className="p-stat-v" style={{ color: accent }}>{s.v}</div>
                <div className="p-stat-l">{s.l}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// Specs grid section — page steps off the scrolling controller and goes editorial
function SpecsSection({ accent }) {
  const groups = [
    {
      h: 'Boîtier',
      rows: [
        ['Dimensions', '160 × 105 × 65 mm'],
        ['Masse', '282 g'],
        ['Coque', 'polycarbonate teint masse'],
        ['Finitions', '4 — graphite, ivoire, plomb, lime'],
      ],
    },
    {
      h: 'Capteurs',
      rows: [
        ['Joysticks', 'effet Hall · 16 bits'],
        ['Gâchettes', 'à course adaptative'],
        ['Pavé tactile', '1280 × 720 capacitif'],
        ['Inertiel', '6 axes · 1 kHz'],
      ],
    },
    {
      h: 'Connexion',
      rows: [
        ['Sans-fil', 'Bluetooth 5.4 · 2.4 GHz dédié'],
        ['Filaire', 'USB-C · audio passthrough'],
        ['Latence', '<3 ms · 2.4 GHz'],
        ['Compatibilité', 'PC · Mac · Linux · iOS · Android'],
      ],
    },
    {
      h: 'Énergie',
      rows: [
        ['Batterie', '1 700 mAh · Li-Po'],
        ['Autonomie', 'jusqu’à 38 h'],
        ['Charge', 'USB-C 18 W · plein en 90 min'],
        ['Veille', '180 jours'],
      ],
    },
  ];
  return (
    <section className="p-specs" id="caracteristiques" data-screen-label="06 Caractéristiques">
      <div className="p-specs-head">
        <div className="mono p-specs-tag" style={{ color: accent }}>§ 06 — Caractéristiques</div>
        <h2 className="p-specs-h">Tout, dans le détail.</h2>
        <p className="p-specs-lead">
          On a passé deux ans à choisir chaque pièce. On a passé six mois à choisir chaque chiffre.
        </p>
      </div>
      <div className="p-specs-grid">
        {groups.map(g => (
          <div key={g.h} className="p-spec-col">
            <div className="p-spec-h mono">{g.h}</div>
            <dl>
              {g.rows.map(([k, v]) => (
                <div key={k} className="p-spec-row">
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

// Pre-order CTA — closing scene
function OrderSection({ accent }) {
  return (
    <section className="p-order" id="commander" data-screen-label="07 Commander">
      <div className="p-order-card">
        <div className="mono" style={{ color: accent, fontSize: 11, letterSpacing: '0.16em' }}>
          PRÉCOMMANDE OUVERTE
        </div>
        <h2 className="p-order-h">Première série limitée — 1 200 pièces.</h2>
        <p className="p-order-t">
          Livraison en septembre 2026. Garantie 3 ans, pièces détachées disponibles 10 ans, charte
          de réparation incluse. Fabriqué à 86&nbsp;% en Europe.
        </p>
        <div className="p-order-row">
          <div className="p-price">
            <span className="p-price-from mono">à partir de</span>
            <span className="p-price-v">219 €</span>
          </div>
          <div className="p-order-actions">
            <a href="#" className="p-btn-primary" style={{ background: accent, color: '#08080A' }}>
              Réserver une manette
            </a>
            <a href="#" className="p-btn-ghost">Recevoir la fiche technique</a>
          </div>
        </div>
        <div className="p-order-foot mono">
          <span>● 814 / 1200 réservées</span>
          <span>Numérotée à la commande</span>
          <span>Annulation libre jusqu’à expédition</span>
        </div>
      </div>
    </section>
  );
}

// Footer
function ProductFooter({ accent }) {
  return (
    <footer className="p-footer">
      <div className="p-foot-mark">MANETTE</div>
      <div className="p-foot-cols">
        <div>
          <div className="p-foot-h mono">Maison</div>
          <a href="#">Manifeste</a><a href="#">Atelier</a><a href="#">Carrières</a><a href="#">Presse</a>
        </div>
        <div>
          <div className="p-foot-h mono">Produit</div>
          <a href="#">MNT—01</a><a href="#">Accessoires</a><a href="#">SDK</a><a href="#">Support</a>
        </div>
        <div>
          <div className="p-foot-h mono">Légal</div>
          <a href="#">Mentions</a><a href="#">CGV</a><a href="#">Vie privée</a><a href="#">Cookies</a>
        </div>
        <div>
          <div className="p-foot-h mono">Contact</div>
          <a href="#">bonjour@manette.fr</a><a href="#">+33 1 84 80 — 24</a><a href="#">Paris · 11ᵉ</a>
        </div>
      </div>
      <div className="p-foot-bottom mono">
        <span>© 2026 Manette SAS</span>
        <span>RCS Paris 932 014 558</span>
        <span style={{ color: accent }}>fait à la main, à Paris</span>
      </div>
    </footer>
  );
}

// HUD — telemetry overlay tied to scroll, makes the 3D feel "live"
function SceneHUD({ progress, accent }) {
  // Pretend telemetry derived from progress for visual effect
  const ry = (progress * 360 - 18).toFixed(1);
  const rx = (Math.sin(progress * 6.28) * 30).toFixed(1);
  const zoom = (1 + Math.sin(progress * 6.28) * 0.18).toFixed(2);
  return (
    <div className="p-hud mono">
      <div className="p-hud-tl">
        <span style={{ color: accent }}>● VIEW</span>
        <span>RY {ry}°</span>
        <span>RX {rx}°</span>
        <span>ZOOM {zoom}×</span>
      </div>
      <div className="p-hud-tr">
        <span style={{ color: accent }}>MNT—01</span>
        <span>SCAN 0.{Math.floor(progress * 999).toString().padStart(3, '0')}</span>
      </div>
      <div className="p-hud-bl">
        <div className="p-hud-bar">
          <div className="p-hud-bar-fill" style={{ width: `${progress * 100}%`, background: accent }} />
        </div>
        <span>SCROLL {(progress * 100).toFixed(0)}%</span>
      </div>
      <div className="p-hud-br">
        <span>02 / 07 SCÈNES</span>
      </div>
    </div>
  );
}

function ProductApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [scrolled, setScrolled] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const fp = FONT_PAIRS[t.fontPair] || FONT_PAIRS.grotesk;
    const root = document.documentElement;
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--font-display', fp.display);
    root.style.setProperty('--font-body', fp.body);
    root.style.setProperty('--font-mono', fp.mono);
    if (t.dark) {
      root.style.setProperty('--bg', '#06060A');
      root.style.setProperty('--bg-2', '#0A0A12');
      root.style.setProperty('--surface', '#10101A');
      root.style.setProperty('--fg', '#F5F4F0');
      root.style.setProperty('--fg-mid', 'rgba(245,244,240,0.66)');
      root.style.setProperty('--fg-dim', 'rgba(245,244,240,0.40)');
      root.style.setProperty('--rule', 'rgba(245,244,240,0.10)');
    } else {
      root.style.setProperty('--bg', '#F4F2EC');
      root.style.setProperty('--bg-2', '#EAE7DE');
      root.style.setProperty('--surface', '#FAF8F1');
      root.style.setProperty('--fg', '#0A0A0E');
      root.style.setProperty('--fg-mid', 'rgba(10,10,14,0.66)');
      root.style.setProperty('--fg-dim', 'rgba(10,10,14,0.42)');
      root.style.setProperty('--rule', 'rgba(10,10,14,0.10)');
    }
  }, [t]);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const motionFactor = t.motion / 60;

  return (
    <div className={`p-app ${t.dark ? 'dark' : 'light'}`}>
      <div className="p-scene-stage">
        <ProductScene
          accent={t.accent}
          motionFactor={motionFactor}
          dark={t.dark}
          onProgress={setProgress}
        />
        <div className="p-scene-vignette" />
        <div className="p-scene-glow" style={{ background: `radial-gradient(60% 50% at 50% 60%, ${t.accent}22, transparent 70%)` }} />
        <SceneHUD progress={progress} accent={t.accent} />
      </div>

      <ProductTopbar accent={t.accent} scrolled={scrolled} />

      <main className="p-content">
        <HeroProduct accent={t.accent} headline={t.headline} tagline={t.tagline} />

        <SceneSection
          id="objet"
          label="02 Objet"
          accent={t.accent}
          kicker="§ 02 · L'objet — zoom gâchette"
          title="Une pièce, taillée pour la main qui décide."
          body="Manette est un boîtier monolithique en polycarbonate teint dans la masse, fraisé sur trois axes pour que chaque arête épouse la pulpe. On l'ouvre avec quatre vis, on la répare avec douze pièces. Aucune n'est collée."
          side="right"
          stats={[
            { v: '282g', l: 'masse' },
            { v: '4', l: 'finitions' },
            { v: '12', l: 'pièces détachées' },
          ]}
        />

        <SceneSection
          id="matiere"
          label="03 Matière"
          accent={t.accent}
          kicker="§ 03 · Matière — vue éclatée"
          title="Quatre coques, douze pièces, zéro colle."
          body="On ouvre Manette avec un seul tournevis. Chaque pièce porte un numéro gravé, chaque pièce est listée sur le manuel, chaque pièce est livrable séparément pendant dix ans. Le démontage n'est pas un geste de réparation, c'est un geste d'usage."
          side="left"
          stats={[
            { v: '7', l: 'passages' },
            { v: '0', l: 'peinture' },
            { v: '86%', l: 'matière européenne' },
          ]}
        />

        <SceneSection
          id="capteurs"
          label="04 Capteurs"
          accent={t.accent}
          kicker="§ 04 · Capteurs — vue rayons-X"
          title="Sous la coque, l'horlogerie."
          body="Les joysticks reposent sur un effet Hall qui ignore l'usure mécanique. Les gâchettes lisent leur course en 16 bits et réagissent à la milliseconde. Le pavé tactile est une vraie surface — pas un mouchoir capacitif."
          side="right"
          stats={[
            { v: '16-bit', l: 'résolution' },
            { v: '<3 ms', l: 'latence' },
            { v: '1 kHz', l: 'inertiel' },
          ]}
        />

        <SceneSection
          id="geste"
          label="05 Geste"
          accent={t.accent}
          kicker="§ 05 · Le geste — gros plan"
          title="On a écrit la grammaire avant l'électronique."
          body="Avant la moindre carte, on a observé deux cents joueurs pendant six mois. Manette n’ajoute pas de boutons : elle redistribue la pression, redessine la course, et laisse vos pouces tranquilles. Le reste, c’est de la précision."
          side="left"
          stats={[
            { v: '200', l: 'sessions filmées' },
            { v: '6 mois', l: 'recherche' },
            { v: '0', l: 'bouton inutile' },
          ]}
        />

        <SpecsSection accent={t.accent} />
        <OrderSection accent={t.accent} />
        <ProductFooter accent={t.accent} />
      </main>

      <TweaksPanel title="Tweaks · MANETTE">
        <TweakSection label="Couleur d'accent">
          <TweakColor
            label="Accent"
            value={t.accent}
            options={['#C8FF3C', '#3CE8FF', '#FF6BD6', '#FFB347', '#9B8CFF', '#F5F4F0']}
            onChange={v => setTweak('accent', v)}
          />
        </TweakSection>

        <TweakSection label="Typographie">
          <TweakSelect
            label="Pairing"
            value={t.fontPair}
            options={Object.entries(FONT_PAIRS).map(([v, o]) => ({ value: v, label: o.label }))}
            onChange={v => setTweak('fontPair', v)}
          />
        </TweakSection>

        <TweakSection label="Apparence">
          <TweakToggle label="Mode sombre" value={t.dark} onChange={v => setTweak('dark', v)} />
          <TweakSlider
            label="Intensité animation"
            value={t.motion}
            min={0} max={120} step={5} unit="%"
            onChange={v => setTweak('motion', v)}
          />
        </TweakSection>

        <TweakSection label="Copy">
          <TweakText label="Wordmark" value={t.headline} onChange={v => setTweak('headline', v)} />
          <TweakText label="Tagline" value={t.tagline} onChange={v => setTweak('tagline', v)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ProductApp />);
