"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { drawItem, drawBun, drawChurrasco, GOODS, type IngredientType } from "./game-graphics";
import { claimSanwich } from "@/actions/sanwich";
import "./sanwich.css";

type Phase = "form" | "game" | "ticket";
type Coupon = { code: string; name: string; reward: string };

const GOAL = 8;
const TIME = 30;

export function SanwichClient() {
  const [phase, setPhase] = useState<Phase>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  const embersRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<HTMLCanvasElement>(null);

  // Brasas de fondo (siempre activas)
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const c = embersRef.current;
    if (!c || reduce) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let W = 0, H = 0, raf = 0;
    type P = { x: number; y: number; r: number; s: number; a: number; drift: number };
    let parts: P[] = [];
    const mk = (): P => ({
      x: Math.random() * W, y: H + Math.random() * 60,
      r: Math.random() * 2 + 0.6, s: Math.random() * 0.5 + 0.2,
      a: Math.random() * 0.5 + 0.2, drift: (Math.random() - 0.5) * 0.3,
    });
    const resize = () => {
      W = c.width = window.innerWidth; H = c.height = window.innerHeight;
      parts = Array.from({ length: 46 }, () => { const p = mk(); p.y = Math.random() * H; return p; });
    };
    resize();
    window.addEventListener("resize", resize);
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.y -= p.s; p.x += p.drift;
        if (p.y < -10) { parts[i] = mk(); continue; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28);
        ctx.fillStyle = "rgba(242,184,75," + p.a + ")";
        ctx.shadowColor = "rgba(224,114,44,0.9)"; ctx.shadowBlur = 8;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  // Mini-juego "Arma tu churrasco"
  useEffect(() => {
    if (phase !== "game") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const cv = gameRef.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = cv.getBoundingClientRect();
    const CW = rect.width, CH = rect.height;
    cv.width = CW * dpr; cv.height = CH * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    type Drop = { x: number; y: number; vy: number; type: IngredientType; bad: boolean; hit: boolean; rot: number; spin: number };
    const plateW = 88;
    let plateX = CW / 2;
    let drops: Drop[] = [];
    let spawnT = 0, caught = 0, timeLeft = TIME, done = false, last = 0;
    let raf = 0;

    const caughtEl = document.getElementById("sw-caught");
    const barEl = document.getElementById("sw-bar");
    const timeEl = document.getElementById("sw-time");
    const setBar = () => {
      if (caughtEl) caughtEl.textContent = String(caught);
      if (barEl) (barEl as HTMLElement).style.width = (caught / GOAL) * 100 + "%";
    };
    setBar();

    const moveTo = (clientX: number) => {
      const r = cv.getBoundingClientRect();
      plateX = Math.max(plateW / 2, Math.min(CW - plateW / 2, clientX - r.left));
    };
    const onMove = (e: PointerEvent) => moveTo(e.clientX);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerdown", onMove);

    const spawn = () => {
      const bad = Math.random() < 0.18;
      drops.push({
        x: 26 + Math.random() * (CW - 52), y: -24,
        vy: 70 + Math.random() * 55 + (TIME - timeLeft) * 2,
        type: bad ? "skull" : GOODS[Math.floor(Math.random() * GOODS.length)],
        bad, hit: false, rot: (Math.random() - 0.5) * 0.5, spin: (Math.random() - 0.5) * 1.1,
      });
    };

    const win = () => {
      done = true;
      window.clearInterval(timer);
      cancelAnimationFrame(raf);
      g.clearRect(0, 0, CW, CH);
      drawChurrasco(g, CW / 2, CH / 2 - 12);
      g.fillStyle = "#f4ede0"; g.font = "700 18px system-ui";
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("¡Churrasco listo!", CW / 2, CH / 2 + 52);
      window.setTimeout(() => setPhase("ticket"), 850);
    };

    const frame = (ts: number) => {
      if (done) return;
      if (!last) last = ts;
      const dt = Math.min((ts - last) / 1000, 0.05); last = ts;
      const plateY = CH - 34;
      spawnT += dt;
      if (spawnT > 0.62) { spawnT = 0; spawn(); }
      g.clearRect(0, 0, CW, CH);
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.y += d.vy * dt; d.rot += d.spin * dt;
        if (!d.hit && d.y > plateY - 22 && d.y < plateY + 14 && Math.abs(d.x - plateX) < plateW / 2 + 4) {
          d.hit = true;
          if (d.bad) caught = Math.max(0, caught - 1);
          else caught++;
          setBar(); drops.splice(i, 1);
          if (caught >= GOAL) { win(); return; }
          continue;
        }
        if (d.y > CH + 30) { drops.splice(i, 1); continue; }
        drawItem(g, d.type, d.x, d.y, 1, d.rot);
      }
      drawBun(g, plateX, plateY, plateW);
      raf = requestAnimationFrame(frame);
    };

    const timer = window.setInterval(() => {
      if (done) return;
      timeLeft--;
      if (timeEl) timeEl.textContent = String(timeLeft);
      if (timeLeft <= 0) {
        window.clearInterval(timer);
        if (caught >= 1) win();
        else {
          done = true; cancelAnimationFrame(raf);
          const tip = document.getElementById("sw-tip");
          if (tip) tip.textContent = "¡Casi! Pero te regalamos el cupón igual 😉";
          window.setTimeout(() => setPhase("ticket"), 900);
        }
      }
    }, 1000);

    if (reduce) {
      g.clearRect(0, 0, CW, CH);
      drawChurrasco(g, CW / 2, CH / 2);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      done = true;
      cancelAnimationFrame(raf);
      window.clearInterval(timer);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerdown", onMove);
      drops = [];
    };
  }, [phase]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) { setError("Ingresa tu nombre"); return; }
    if (phone.replace(/\D/g, "").length < 8) { setError("Ingresa un WhatsApp válido"); return; }
    setSubmitting(true);
    try {
      const res = await claimSanwich({ name: name.trim(), phone: phone.trim() });
      if (!res.ok) { setError(res.error); return; }
      setCoupon({ code: res.code, name: res.name, reward: res.reward });
      setPhase("game");
    } catch {
      setError("Sin conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const firstName = coupon?.name.split(" ")[0] ?? "";

  return (
    <div className="sw">
      <canvas ref={embersRef} className="sw-embers" aria-hidden="true" />
      <div className="sw-page">
        <div className="sw-wrap">
          <header>
            <span className="eyebrow"><span className="dot" />Estreno nocturno · Iquique</span>
            <h1>La noche<br />tiene <span className="glow">hambre</span></h1>
            <p className="sub">Doña Any abre de noche: churrascos de verdad y salchipapas para compartir. Reclama tu recompensa de estreno.</p>

            <div className="menu">
              <span className="chip"><span>◆</span> Churrascos</span>
              <span className="chip"><span>◆</span> Salchipapas</span>
              <span className="chip"><span>◆</span> Completos</span>
              <span className="chip"><span>◆</span> Sándwiches</span>
            </div>

            <div className="reward">
              <div className="lbl">Tu recompensa de estreno</div>
              <div className="big">2x1 en<br />churrascos</div>
              <div className="fine">lleva dos, paga uno · solo por el mes de estreno</div>
            </div>
          </header>

          {phase === "form" && (
            <div className="card">
              <h2>Reclama la tuya</h2>
              <p className="hint">Déjanos tus datos y te generamos el cupón al instante. Lo muestras en el local y listo.</p>
              <form onSubmit={handleSubmit} noValidate>
                <label htmlFor="sw-name">Tu nombre</label>
                <input id="sw-name" type="text" placeholder="Ej: Camila Rojas" autoComplete="name"
                  value={name} onChange={(e) => setName(e.target.value)} required />

                <label htmlFor="sw-phone">WhatsApp</label>
                <input id="sw-phone" type="tel" inputMode="tel" placeholder="+56 9 ____ ____" autoComplete="tel"
                  value={phone} onChange={(e) => setPhone(e.target.value)} required />

                {error && <p className="err">{error}</p>}
                <button className="btn" type="submit" disabled={submitting}>
                  {submitting ? "Generando…" : "Reclamar mi recompensa"}
                </button>
                <p className="consent">Te avisaremos por WhatsApp de las próximas noches. Nada de spam.</p>
              </form>
            </div>
          )}

          {phase === "game" && (
            <div className="card game">
              <h2>Arma tu churrasco 🔥</h2>
              <p className="hint">Mueve el pan y atrapa <b>8 ingredientes</b> antes que se acabe el tiempo. ¡Esquiva las calaveras 💀! Cuando lo armes, tu cupón se desbloquea.</p>
              <div className="goal">
                <div className="count"><span id="sw-caught">0</span><small>/8 ingredientes</small></div>
                <div className="timer">⏱ <span id="sw-time">30</span>s</div>
              </div>
              <div className="bar"><i id="sw-bar" /></div>
              <canvas ref={gameRef} className="sw-canvas" />
              <p className="tip" id="sw-tip">Desliza el dedo (o el mouse) para mover el pan</p>
              <button className="skip" type="button" onClick={() => setPhase("ticket")}>
                No puedo jugar — dame mi cupón
              </button>
            </div>
          )}

          {phase === "ticket" && coupon && (
            <div className="ticket-wrap">
              <div className="ticket">
                <div className="t-lbl">Cupón Doña Any · Noche de estreno</div>
                <div className="t-reward">{coupon.reward}</div>
                <div className="t-name">A nombre de <b>{firstName}</b></div>
                <div className="perf">
                  <div className="t-lbl" style={{ textAlign: "center", marginBottom: 8 }}>Muestra este código</div>
                  <div className="code">{coupon.code}</div>
                  <p className="redeem">Muestra esta pantalla en <b>Padre Hurtado #2245</b> al pedir tus churrascos.<br />Tú pides dos, pagas uno.</p>
                  <div style={{ textAlign: "center" }}><span className="badge-valid">✓ Válido en el estreno</span></div>
                </div>
              </div>
            </div>
          )}

          <footer>
            <div className="foot-name">Doña Any</div>
            <div className="foot-info">
              <span className="pin">📍</span> Padre Hurtado #2245 · Iquique<br />
              Atención de noche · 17:00 – 21:00 hrs
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
