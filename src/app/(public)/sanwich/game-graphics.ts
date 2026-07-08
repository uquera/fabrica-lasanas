// Ilustraciones vectoriales del mini-juego "Arma tu churrasco" (canvas 2D).

type Ctx = CanvasRenderingContext2D

export type IngredientType =
  | "meat" | "avocado" | "tomato" | "cheese" | "bacon" | "lettuce" | "skull"

export const GOODS: IngredientType[] = ["meat", "avocado", "tomato", "cheese", "bacon", "lettuce"]

function rr(g: Ctx, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}

function meat(g: Ctx, s: number) {
  const w = 31 * s, h = 21 * s
  const grd = g.createLinearGradient(0, -h / 2, 0, h / 2)
  grd.addColorStop(0, "#9a5330"); grd.addColorStop(1, "#5a2d1a")
  g.fillStyle = grd; rr(g, -w / 2, -h / 2, w, h, 9 * s); g.fill()
  g.strokeStyle = "rgba(28,13,6,0.55)"; g.lineWidth = 2.4 * s; g.lineCap = "round"
  g.beginPath()
  g.moveTo(-w / 2 + 6, -3 * s); g.lineTo(w / 2 - 6, -6 * s)
  g.moveTo(-w / 2 + 6, 4 * s); g.lineTo(w / 2 - 6, 1 * s)
  g.stroke()
  g.fillStyle = "rgba(255,220,180,0.18)"; rr(g, -w / 2 + 4, -h / 2 + 2, w - 8, 5 * s, 3 * s); g.fill()
}

function avocado(g: Ctx, s: number) {
  g.fillStyle = "#37542b"; g.beginPath(); g.ellipse(0, 0, 14 * s, 17 * s, 0, 0, 6.283); g.fill()
  g.fillStyle = "#b6cf76"; g.beginPath(); g.ellipse(0, 0, 10.5 * s, 13.5 * s, 0, 0, 6.283); g.fill()
  g.fillStyle = "#8a5a2c"; g.beginPath(); g.arc(0, 3.5 * s, 5 * s, 0, 6.283); g.fill()
  g.fillStyle = "rgba(255,255,255,0.28)"; g.beginPath(); g.arc(-1.6 * s, 1.8 * s, 1.8 * s, 0, 6.283); g.fill()
}

function tomato(g: Ctx, s: number) {
  g.fillStyle = "#bd3227"; g.beginPath(); g.arc(0, 0, 15 * s, 0, 6.283); g.fill()
  g.fillStyle = "#e8654f"; g.beginPath(); g.arc(0, 0, 11 * s, 0, 6.283); g.fill()
  g.fillStyle = "#f6c0ad"
  for (let i = 0; i < 6; i++) {
    g.save(); g.rotate((i / 6) * 6.283)
    g.beginPath(); g.ellipse(0, -6.5 * s, 1.7 * s, 2.6 * s, 0, 0, 6.283); g.fill()
    g.restore()
  }
}

function cheese(g: Ctx, s: number) {
  g.fillStyle = "#f2c14e"
  g.beginPath()
  g.moveTo(-15 * s, -9 * s); g.lineTo(15 * s, -12 * s)
  g.lineTo(15 * s, 9 * s); g.lineTo(-15 * s, 12 * s); g.closePath(); g.fill()
  g.fillStyle = "rgba(255,255,255,0.28)"
  g.beginPath()
  g.moveTo(-15 * s, -9 * s); g.lineTo(15 * s, -12 * s)
  g.lineTo(15 * s, -8.5 * s); g.lineTo(-15 * s, -5.5 * s); g.closePath(); g.fill()
  g.fillStyle = "#d99f2f"
  g.beginPath(); g.arc(-5 * s, -1 * s, 2.6 * s, 0, 6.283); g.fill()
  g.beginPath(); g.arc(6 * s, 4 * s, 2 * s, 0, 6.283); g.fill()
}

function bacon(g: Ctx, s: number) {
  g.lineCap = "round"
  const path = () => {
    g.beginPath()
    g.moveTo(-15 * s, -5 * s)
    g.quadraticCurveTo(-4 * s, 7 * s, 3 * s, -3 * s)
    g.quadraticCurveTo(10 * s, -10 * s, 15 * s, 5 * s)
  }
  g.strokeStyle = "#b0463a"; g.lineWidth = 11 * s; path(); g.stroke()
  g.strokeStyle = "#edb6a4"; g.lineWidth = 3.5 * s; path(); g.stroke()
}

function lettuce(g: Ctx, s: number) {
  g.fillStyle = "#6ea83f"
  g.beginPath()
  const pts = 12
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * 6.283
    const r = (i % 2 ? 11 : 15) * s
    const px = Math.cos(a) * r, py = Math.sin(a) * r * 0.72
    if (i) g.lineTo(px, py); else g.moveTo(px, py)
  }
  g.closePath(); g.fill()
  g.fillStyle = "#8fc460"; g.beginPath(); g.ellipse(0, 0, 8 * s, 5 * s, 0, 0, 6.283); g.fill()
  g.fillStyle = "rgba(255,255,255,0.2)"; g.beginPath(); g.ellipse(-2 * s, -1.5 * s, 3 * s, 2 * s, 0, 0, 6.283); g.fill()
}

function skull(g: Ctx, s: number) {
  g.fillStyle = "#ece3d0"
  g.beginPath(); g.arc(0, -2 * s, 12.5 * s, 0, 6.283); g.fill()
  rr(g, -7 * s, 5 * s, 14 * s, 9 * s, 3 * s); g.fill()
  g.fillStyle = "#241a12"
  g.beginPath(); g.arc(-5 * s, -3 * s, 4 * s, 0, 6.283); g.fill()
  g.beginPath(); g.arc(5 * s, -3 * s, 4 * s, 0, 6.283); g.fill()
  g.beginPath(); g.moveTo(0, 0); g.lineTo(-2.4 * s, 4 * s); g.lineTo(2.4 * s, 4 * s); g.closePath(); g.fill()
  g.strokeStyle = "#241a12"; g.lineWidth = 1.3 * s
  g.beginPath()
  g.moveTo(-4 * s, 6 * s); g.lineTo(-4 * s, 13 * s)
  g.moveTo(0, 6 * s); g.lineTo(0, 14 * s)
  g.moveTo(4 * s, 6 * s); g.lineTo(4 * s, 13 * s)
  g.stroke()
}

export function drawItem(g: Ctx, type: IngredientType, x: number, y: number, s: number, rot: number) {
  g.save()
  g.translate(x, y)
  g.fillStyle = "rgba(0,0,0,0.28)"
  g.beginPath(); g.ellipse(0, 16 * s, 12 * s, 3.4 * s, 0, 0, 6.283); g.fill()
  if (rot) g.rotate(rot)
  switch (type) {
    case "meat": meat(g, s); break
    case "avocado": avocado(g, s); break
    case "tomato": tomato(g, s); break
    case "cheese": cheese(g, s); break
    case "bacon": bacon(g, s); break
    case "lettuce": lettuce(g, s); break
    case "skull": skull(g, s); break
  }
  g.restore()
}

export function drawBun(g: Ctx, x: number, y: number, w: number) {
  const h = w * 0.46
  g.save(); g.translate(x, y)
  g.fillStyle = "rgba(0,0,0,0.3)"
  g.beginPath(); g.ellipse(0, h * 0.58, w * 0.5, h * 0.2, 0, 0, 6.283); g.fill()
  const grd = g.createLinearGradient(0, -h / 2, 0, h / 2)
  grd.addColorStop(0, "#f4d089"); grd.addColorStop(0.55, "#e3ac4f"); grd.addColorStop(1, "#c78d33")
  g.fillStyle = grd; rr(g, -w / 2, -h / 2, w, h, h / 2); g.fill()
  g.fillStyle = "rgba(255,255,255,0.3)"; rr(g, -w / 2 + 6, -h / 2 + 3, w - 12, h * 0.26, h * 0.13); g.fill()
  g.fillStyle = "#f7ecc9"
  const seeds = [[-w * 0.22, -1], [-w * 0.05, -4], [w * 0.12, -1], [w * 0.28, -3], [-w * 0.34, 1]]
  for (let i = 0; i < seeds.length; i++) {
    g.save(); g.translate(seeds[i][0], seeds[i][1]); g.rotate(i - 2)
    g.beginPath(); g.ellipse(0, 0, 2.4, 1.3, 0, 0, 6.283); g.fill(); g.restore()
  }
  g.restore()
}

export function drawChurrasco(g: Ctx, x: number, y: number) {
  const w = 96
  drawBun(g, x, y + 22, w)
  drawItem(g, "meat", x, y + 6, 1.2, 0)
  drawItem(g, "tomato", x - 18, y - 2, 0.7, 0)
  drawItem(g, "lettuce", x + 16, y - 4, 0.82, 0)
  g.save(); g.translate(x, y - 14)
  const grd = g.createLinearGradient(0, -24, 0, 8)
  grd.addColorStop(0, "#f4d089"); grd.addColorStop(1, "#d99a3f")
  g.fillStyle = grd
  g.beginPath()
  g.moveTo(-w / 2, 8); g.quadraticCurveTo(-w / 2, -24, 0, -24)
  g.quadraticCurveTo(w / 2, -24, w / 2, 8); g.closePath(); g.fill()
  g.fillStyle = "#f7ecc9"
  const ts = [[-w * 0.2, -6], [0, -10], [w * 0.18, -5]]
  for (let i = 0; i < ts.length; i++) {
    g.save(); g.translate(ts[i][0], ts[i][1]); g.rotate(i - 1)
    g.beginPath(); g.ellipse(0, 0, 2.6, 1.4, 0, 0, 6.283); g.fill(); g.restore()
  }
  g.restore()
}
