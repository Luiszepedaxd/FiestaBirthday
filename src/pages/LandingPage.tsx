import { useEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import { Link } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ContactCard {
  name: string;
  initials: string;
  color: string;
  date: string;
  badge: string;
  badgeHot: boolean;
  days: number | null;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const HERO_CARDS: ContactCard[] = [
  {
    name: "Ana García",
    initials: "AG",
    color: "#C6017F",
    date: "30 de marzo",
    badge: "¡Hoy! 🎉",
    badgeHot: true,
    days: null,
  },
  {
    name: "Luis Martínez",
    initials: "LM",
    color: "#5221D6",
    date: "2 de abril",
    badge: "en 3 días",
    badgeHot: false,
    days: 3,
  },
  {
    name: "Sofía Reyes",
    initials: "SR",
    color: "#E0407B",
    date: "14 de abril",
    badge: "en 15 días",
    badgeHot: false,
    days: 15,
  },
];

const FEATURES = [
  {
    icon: "🔔",
    title: "Recordatorios inteligentes",
    desc: "Alertas automáticas 7 días antes. Nunca más un 'se me olvidó'.",
  },
  {
    icon: "🎁",
    title: "Sugerencias con IA",
    desc: "IA que conoce los gustos de tu contacto y sugiere el regalo perfecto con links de compra.",
  },
  {
    icon: "💬",
    title: "Felicitación por WhatsApp",
    desc: "Envía un mensaje personalizado directo a su WhatsApp en segundos.",
  },
  {
    icon: "🎉",
    title: "Organiza la fiesta",
    desc: "Conectamos con Fiestamas para que encuentres salón, música y todo lo demás.",
  },
];

// ─── Hook: Intersection Observer ─────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = "1";
            (entry.target as HTMLElement).style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.12 }
    );

    const root = document.getElementById("fiestamas-landing");
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav style={styles.navbar}>
      <div style={styles.navInner}>
        <span style={styles.logo}>fiestamas</span>
        <div style={styles.navActions}>
          <Link
            to="/login"
            style={styles.btnGhost}
            className="nav-login"
          >
            Iniciar sesión
          </Link>
          <Link to="/signup" style={styles.btnPrimary}>
            Crear cuenta
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroCard({
  card,
  delay,
}: {
  card: ContactCard;
  delay: string;
}) {
  return (
    <div
      style={{
        ...styles.heroCard,
        animationDelay: delay,
      }}
      className="hero-card"
    >
      <div style={styles.heroCardHeader}>
        <div
          style={{
            ...styles.avatar,
            background: card.color,
          }}
        >
          {card.initials}
        </div>
        <div>
          <p style={styles.cardName}>{card.name}</p>
          <p style={styles.cardDate}>🎂 {card.date}</p>
        </div>
      </div>
      <div style={styles.heroCardFooter}>
        <span
          style={{
            ...styles.badge,
            ...(card.badgeHot ? styles.badgeHot : styles.badgeCool),
          }}
        >
          {card.badge}
        </span>
        {card.days !== null && (
          <div style={styles.countdown}>
            <span style={styles.countdownNum}>{card.days}</span>
            <span style={styles.countdownLabel}>días</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div style={styles.featureCard} className="feature-card">
      <div style={styles.featureIcon}>{icon}</div>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDesc}>{desc}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  useScrollReveal();
  const featuresRef = useRef<HTMLElement | null>(null);

  function scrollToFeatures(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <style>{CSS}</style>

      <div id="fiestamas-landing">
      {/* ── Navbar ── */}
      <Navbar />

      <main>
        {/* ── Hero ── */}
        <section style={styles.hero} data-reveal>
          <div style={styles.heroInner}>
            <span style={styles.poweredBadge}>✨ Powered by IA</span>

            <h1 style={styles.heroTitle}>
              Nunca olvides un{" "}
              <span style={styles.heroAccent}>cumpleaños</span>
              <br />
              importante
            </h1>

            <p style={styles.heroSubtitle}>
              Recuerda, felicita y sorprende a las personas que más quieres.
              Con IA que conoce sus gustos.
            </p>

            <div style={styles.heroButtons}>
              <Link to="/signup" style={styles.btnPrimaryLarge}>
                Comenzar gratis
              </Link>
              <a
                href="#features"
                style={styles.btnGhostLarge}
                onClick={scrollToFeatures}
              >
                Ver cómo funciona&nbsp;→
              </a>
            </div>

            {/* Floating cards */}
            <div style={styles.heroCards}>
              {HERO_CARDS.map((card, i) => (
                <HeroCard
                  key={card.name}
                  card={card}
                  delay={`${i * 0.5}s`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section
          id="features"
          ref={featuresRef}
          style={styles.features}
          data-reveal
        >
          <div style={styles.sectionInner}>
            <span style={styles.sectionEyebrow}>Funcionalidades</span>
            <h2 style={styles.sectionTitle}>Todo lo que necesitas</h2>
            <p style={styles.sectionSubtitle}>
              Para no olvidar ni un cumpleaños
            </p>

            <div style={styles.featuresGrid}>
              {FEATURES.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section style={styles.pricing} data-reveal>
          <div style={styles.sectionInner}>
            <span style={styles.sectionEyebrow}>Precios</span>
            <h2 style={styles.sectionTitle}>Simple y transparente</h2>
            <p style={styles.sectionSubtitle}>
              Empieza gratis, crece cuando quieras
            </p>

            <div style={styles.pricingGrid}>
              {/* Free */}
              <div style={styles.cardFree} className="pricing-card">
                <span style={styles.freeTag}>Gratis para siempre</span>
                <div style={styles.priceLine}>
                  <span style={styles.priceAmount}>$0</span>
                </div>
                <ul style={styles.featureList}>
                  {[
                    "Hasta 10 contactos",
                    "Recordatorios automáticos",
                    "Felicitación por WhatsApp",
                    "3 sugerencias de regalo al mes",
                  ].map((f) => (
                    <li key={f} style={styles.featureListItem}>
                      <span style={styles.checkMagenta}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" style={styles.btnOutline}>
                  Comenzar gratis
                </Link>
              </div>

              {/* Premium */}
              <div style={styles.cardPremium} className="pricing-card">
                <span style={styles.premiumTag}>Premium</span>
                <div style={styles.priceLine}>
                  <span style={styles.priceAmountWhite}>$99</span>
                  <span style={styles.pricePeriod}>MXN/mes</span>
                </div>
                <ul style={styles.featureList}>
                  {[
                    "Contactos ilimitados",
                    "Sugerencias de regalo ilimitadas",
                    "Círculo de celebraciones",
                    "Canción personalizada con IA",
                    "Prioridad en soporte",
                  ].map((f) => (
                    <li key={f} style={styles.featureListItemWhite}>
                      <span style={styles.checkWhite}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" style={styles.btnWhite}>
                  Comenzar Premium
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          © 2025 Fiestamas · Todos los derechos reservados
          <span style={styles.footerDivider}>·</span>
          <Link to="/terms" style={styles.footerLink}>
            Términos
          </Link>
          <span style={styles.footerDivider}>·</span>
          <Link to="/privacy" style={styles.footerLink}>
            Privacidad
          </Link>
        </p>
      </footer>
      </div>
    </>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
/* Encapsulado en #fiestamas-landing para no chocar con Tailwind ni el resto de la app.
   La fuente Plus Jakarta Sans se carga en index.html (sin duplicar @import). */
const CSS = `
  #fiestamas-landing,
  #fiestamas-landing *,
  #fiestamas-landing *::before,
  #fiestamas-landing *::after { box-sizing: border-box; }

  #fiestamas-landing {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #fff;
    color: #141413;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }

  #fiestamas-landing a { text-decoration: none; }

  #fiestamas-landing [data-reveal] {
    opacity: 0;
    transform: translateY(32px);
    transition: opacity 0.65s cubic-bezier(.22,1,.36,1),
                transform 0.65s cubic-bezier(.22,1,.36,1);
  }

  @keyframes fiestamas-landing-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
  }

  #fiestamas-landing .hero-card {
    animation: fiestamas-landing-float 4s ease-in-out infinite;
    transition: box-shadow 0.2s, transform 0.2s;
  }
  #fiestamas-landing .hero-card:hover {
    box-shadow: 0 20px 60px rgba(198,1,127,0.18) !important;
  }

  #fiestamas-landing .feature-card {
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  #fiestamas-landing .feature-card:hover {
    border-color: #C6017F !important;
    box-shadow: 0 8px 32px rgba(198,1,127,0.12) !important;
  }

  #fiestamas-landing .pricing-card {
    transition: transform 0.2s, box-shadow 0.2s;
  }
  #fiestamas-landing .pricing-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 64px rgba(0,0,0,0.12) !important;
  }

  #fiestamas-landing a[href] {
    transition: filter 0.15s, transform 0.15s;
  }
  #fiestamas-landing a[href]:hover {
    filter: brightness(0.92);
    transform: scale(0.98);
  }

  @media (max-width: 640px) {
    #fiestamas-landing .nav-login { display: none !important; }
  }

  @media (max-width: 640px) {
    #fiestamas-landing .hero-title-clamp {
      font-size: clamp(32px, 9vw, 52px) !important;
    }
  }
`;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, CSSProperties> = {
  /* Navbar */
  navbar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 64,
    background: "#fff",
    borderBottom: "1px solid #F2F2F2",
  },
  navInner: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "0 24px",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 800,
    fontSize: 22,
    color: "#C6017F",
    letterSpacing: "-0.5px",
  },
  navActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  btnGhost: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 600,
    fontSize: 14,
    color: "#141413",
    padding: "8px 16px",
    borderRadius: 999,
    border: "1.5px solid #E8E8E8",
    background: "transparent",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  btnPrimary: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    color: "#fff",
    background: "#C6017F",
    padding: "9px 20px",
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    cursor: "pointer",
  },

  /* Hero */
  hero: {
    paddingTop: 128,
    paddingBottom: 80,
    background: "#fff",
  },
  heroInner: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  poweredBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 16px",
    borderRadius: 999,
    background: "rgba(198,1,127,0.08)",
    border: "1px solid rgba(198,1,127,0.2)",
    color: "#C6017F",
    fontWeight: 600,
    fontSize: 13,
    marginBottom: 28,
  },
  heroTitle: {
    fontWeight: 800,
    fontSize: "clamp(40px, 6vw, 72px)",
    lineHeight: 1.1,
    color: "#141413",
    letterSpacing: "-1.5px",
    marginBottom: 20,
  },
  heroAccent: {
    color: "#C6017F",
  },
  heroSubtitle: {
    fontSize: 18,
    color: "#717B99",
    maxWidth: 520,
    lineHeight: 1.65,
    marginBottom: 40,
  },
  heroButtons: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 64,
  },
  btnPrimaryLarge: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    color: "#fff",
    background: "#C6017F",
    padding: "14px 32px",
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    boxShadow: "0 4px 24px rgba(198,1,127,0.30)",
    cursor: "pointer",
  },
  btnGhostLarge: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 600,
    fontSize: 16,
    color: "#4D4D4C",
    padding: "14px 24px",
    borderRadius: 999,
    border: "1.5px solid #E0E0E0",
    background: "transparent",
    display: "inline-flex",
    alignItems: "center",
    cursor: "pointer",
  },

  /* Hero cards */
  heroCards: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  heroCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "20px 24px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
    minWidth: 200,
    maxWidth: 220,
    flex: "1 1 200px",
  },
  heroCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  cardName: {
    fontWeight: 700,
    fontSize: 14,
    color: "#141413",
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 12,
    color: "#717B99",
  },
  heroCardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 999,
  },
  badgeHot: {
    background: "rgba(198,1,127,0.10)",
    color: "#C6017F",
  },
  badgeCool: {
    background: "rgba(82,33,214,0.08)",
    color: "#5221D6",
  },
  countdown: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  countdownNum: {
    fontWeight: 800,
    fontSize: 22,
    color: "#141413",
    lineHeight: 1,
  },
  countdownLabel: {
    fontSize: 10,
    color: "#717B99",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  /* Features */
  features: {
    background: "#FAF9F5",
    padding: "96px 24px",
  },
  sectionInner: {
    maxWidth: 1120,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#C6017F",
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: 800,
    fontSize: 32,
    color: "#141413",
    letterSpacing: "-0.5px",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#717B99",
    marginBottom: 56,
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20,
    width: "100%",
  },
  featureCard: {
    background: "#fff",
    border: "1px solid #F0F0F0",
    borderRadius: 16,
    padding: "28px 24px",
    textAlign: "left",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "rgba(198,1,127,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    marginBottom: 16,
  },
  featureTitle: {
    fontWeight: 700,
    fontSize: 16,
    color: "#141413",
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    color: "#4D4D4C",
    lineHeight: 1.65,
  },

  /* Pricing */
  pricing: {
    background: "#fff",
    padding: "96px 24px",
  },
  pricingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 24,
    width: "100%",
    maxWidth: 720,
  },

  /* Free card */
  cardFree: {
    borderRadius: 20,
    border: "1.5px solid #EBEBEB",
    padding: "36px 32px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  },
  freeTag: {
    display: "inline-flex",
    alignSelf: "flex-start",
    background: "#F5F5F5",
    color: "#4D4D4C",
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: 999,
    letterSpacing: 0.3,
  },
  priceLine: {
    display: "flex",
    alignItems: "baseline",
    gap: 4,
  },
  priceAmount: {
    fontWeight: 800,
    fontSize: 48,
    color: "#141413",
    letterSpacing: "-2px",
  },
  featureList: {
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    textAlign: "left",
  },
  featureListItem: {
    fontSize: 14,
    color: "#4D4D4C",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  checkMagenta: {
    color: "#C6017F",
    fontWeight: 700,
    fontSize: 15,
    flexShrink: 0,
  },
  btnOutline: {
    display: "inline-flex",
    justifyContent: "center",
    padding: "13px 24px",
    borderRadius: 999,
    border: "1.5px solid #C6017F",
    color: "#C6017F",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    marginTop: "auto",
  },

  /* Premium card */
  cardPremium: {
    borderRadius: 20,
    background: "linear-gradient(135deg, #C6017F, #5221D6)",
    padding: "36px 32px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    boxShadow: "0 12px 48px rgba(198,1,127,0.30)",
  },
  premiumTag: {
    display: "inline-flex",
    alignSelf: "flex-start",
    background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.12))",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: 999,
    letterSpacing: 0.5,
    border: "1px solid rgba(255,255,255,0.25)",
  },
  priceAmountWhite: {
    fontWeight: 800,
    fontSize: 48,
    color: "#fff",
    letterSpacing: "-2px",
  },
  pricePeriod: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: 600,
    alignSelf: "flex-end",
    paddingBottom: 8,
    marginLeft: 4,
  },
  featureListItemWhite: {
    fontSize: 14,
    color: "rgba(255,255,255,0.90)",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  checkWhite: {
    color: "#EFA9FA",
    fontWeight: 700,
    fontSize: 15,
    flexShrink: 0,
  },
  btnWhite: {
    display: "inline-flex",
    justifyContent: "center",
    padding: "13px 24px",
    borderRadius: 999,
    background: "#fff",
    color: "#C6017F",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    marginTop: "auto",
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
  },

  /* Footer */
  footer: {
    borderTop: "1px solid #F2F2F2",
    padding: "32px 24px",
    textAlign: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#A1A1A0",
  },
  footerDivider: {
    margin: "0 8px",
    color: "#D0D0D0",
  },
  footerLink: {
    color: "#A1A1A0",
    fontWeight: 500,
  },
};
