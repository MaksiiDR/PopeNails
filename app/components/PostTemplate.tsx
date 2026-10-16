'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cormorant, cinzel } from '@/lib/fonts'
// Las fuentes del post se usan dentro del canvas, por eso se leen por nombre de familia

const W = 1080
const H = 1350
const C = { ink: '#0b0a0d', ivory: '#f3ece0', gold: '#d8b878' }

type Layout = 'marco' | 'completa' | 'firma'
type AdjKey = 'light' | 'contrast' | 'warm' | 'sat'
type Adj = Record<AdjKey, number>

const RECOMENDADO: Adj = { light: 16, contrast: 18, warm: 10, sat: 6 }
const SIN_AJUSTES: Adj = { light: 0, contrast: 0, warm: 0, sat: 0 }
const ADJ_LABELS: { key: AdjKey; label: string }[] = [
  { key: 'light', label: 'Luz' },
  { key: 'contrast', label: 'Contraste' },
  { key: 'warm', label: 'Calidez' },
  { key: 'sat', label: 'Color' },
]

const HASHTAGS: Record<string, string> = {
  Softgel: '#uñasmulchen #softgel #uñassoftgel #nailartchile #uñasdecoradas',
  Semipermanente: '#uñasmulchen #semipermanente #uñassemipermanentes #manicuramulchen #uñasbonitas',
  '': '#uñasmulchen #nailart #diseñodeuñas #nailartchile #uñasdecoradas',
}

function buildFooter(service: string) {
  return [
    '━━━━━━━━━━━━━━',
    '🌙 Pope Nails · Nail Art by Isi',
    '💅🏻 Softgel & semipermanente',
    '✨ Diseños personalizados',
    '📍 Mulchén',
    '📩 Agenda tu horita por DM',
    '━━━━━━━━━━━━━━',
    HASHTAGS[service] ?? HASHTAGS[''],
  ].join('\n')
}

function sameAdj(a: Adj, b: Adj) {
  return a.light === b.light && a.contrast === b.contrast && a.warm === b.warm && a.sat === b.sat
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((ok, no) => {
    const i = new window.Image()
    i.onload = () => ok(i)
    i.onerror = no
    i.src = url
  })
}

// Ajustes de luz y color píxel a píxel (funciona igual en todos los celulares)
function processImage(src: HTMLCanvasElement, adj: Adj) {
  const c = document.createElement('canvas')
  c.width = src.width
  c.height = src.height
  const x = c.getContext('2d')!
  x.drawImage(src, 0, 0)
  if (sameAdj(adj, SIN_AJUSTES)) return c
  const d = x.getImageData(0, 0, c.width, c.height)
  const p = d.data
  const b = adj.light * 1.6
  const k2 = ((100 + adj.contrast) / 100) ** 2
  const wr = adj.warm * 0.55
  const s = 1 + adj.sat / 100
  for (let i = 0; i < p.length; i += 4) {
    let r = (p[i] + b - 128) * k2 + 128
    let g = (p[i + 1] + b - 128) * k2 + 128
    let bl = (p[i + 2] + b - 128) * k2 + 128
    r += wr
    g += wr * 0.35
    bl -= wr
    const y = 0.299 * r + 0.587 * g + 0.114 * bl
    p[i] = y + (r - y) * s
    p[i + 1] = y + (g - y) * s
    p[i + 2] = y + (bl - y) * s
  }
  x.putImageData(d, 0, 0)
  return c
}

function fileName(design: string) {
  const d = (design.trim() || 'post')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `pope-nails-${d || 'post'}.png`
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    ta.remove()
    return ok
  }
}

export default function PostTemplate() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const srcRef = useRef<HTMLCanvasElement | null>(null)
  const processedRef = useRef<HTMLCanvasElement | null>(null)
  const logoRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  const [design, setDesign] = useState('Cerezas')
  const [service, setService] = useState('Softgel')
  const [client, setClient] = useState('Javii')
  const [layout, setLayout] = useState<Layout>('marco')
  const [adj, setAdj] = useState<Adj>(RECOMENDADO)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [version, setVersion] = useState(0) // sube cuando cambia la foto procesada o cargan fuentes
  const [msg, setMsg] = useState('')
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const display = cormorant.style.fontFamily
  const label = cinzel.style.fontFamily
  const footer = buildFooter(service)

  // Carga inicial: logo, fuentes y foto de ejemplo
  useEffect(() => {
    let alive = true
    const fonts = document.fonts
      ? Promise.all([
          document.fonts.load(`italic 500 74px ${display}`),
          document.fonts.load(`500 32px ${display}`),
          document.fonts.load(`500 24px ${label}`),
        ]).catch(() => undefined)
      : Promise.resolve()
    Promise.all([
      loadImage('/plantilla-logo.png').then(i => (logoRef.current = i)).catch(() => undefined),
      loadImage('/plantilla-ejemplo.jpg').then(setSource).catch(() => undefined),
      fonts,
    ]).then(() => alive && setVersion(v => v + 1))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setSource(img: HTMLImageElement) {
    const s = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(img.naturalWidth * s)
    c.height = Math.round(img.naturalHeight * s)
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    srcRef.current = c
    setOffset({ x: 0, y: 0 })
    setZoom(1)
    processedRef.current = processImage(c, adj)
    setVersion(v => v + 1)
  }

  // Reprocesar cuando cambian los ajustes (con una pequeña espera para que el slider vaya fluido)
  useEffect(() => {
    if (!srcRef.current) return
    const t = setTimeout(() => {
      processedRef.current = processImage(srcRef.current!, adj)
      setVersion(v => v + 1)
    }, 60)
    return () => clearTimeout(t)
  }, [adj])

  const photoBox = useCallback(
    () => (layout === 'marco' ? { x: 48, y: 48, w: 984, h: 1050 } : { x: 0, y: 0, w: W, h: H }),
    [layout]
  )

  // Dibujo del post
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    const box = photoBox()
    const ls = (v: string) => {
      ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = v
    }
    const fit = (text: string, font: (s: number) => string, size: number, maxW: number) => {
      let s = size
      ctx.font = font(s)
      while (ctx.measureText(text).width > maxW && s > 24) {
        s -= 2
        ctx.font = font(s)
      }
    }
    const drawLogo = (x: number, y: number, h: number) => {
      const logo = logoRef.current
      if (!logo || !logo.naturalWidth) return
      const w = (h * logo.naturalWidth) / logo.naturalHeight
      ctx.drawImage(logo, x - w, y, w, h)
    }
    const star = (x: number, y: number, r: number) => {
      const k = r * 0.18
      ctx.fillStyle = 'rgba(243,236,224,.85)'
      ctx.beginPath()
      ctx.moveTo(x, y - r)
      ctx.lineTo(x + k, y - k)
      ctx.lineTo(x + r, y)
      ctx.lineTo(x + k, y + k)
      ctx.lineTo(x, y + r)
      ctx.lineTo(x - k, y + k)
      ctx.lineTo(x - r, y)
      ctx.lineTo(x - k, y - k)
      ctx.closePath()
      ctx.fill()
    }

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = C.ink
    ctx.fillRect(0, 0, W, H)

    const pr = processedRef.current
    if (pr) {
      const s = Math.max(box.w / pr.width, box.h / pr.height) * zoom
      const dw = pr.width * s
      const dh = pr.height * s
      const maxX = (dw - box.w) / 2
      const maxY = (dh - box.h) / 2
      ctx.save()
      ctx.beginPath()
      ctx.rect(box.x, box.y, box.w, box.h)
      ctx.clip()
      ctx.drawImage(pr, box.x + (box.w - dw) / 2 + offset.x * maxX, box.y + (box.h - dh) / 2 + offset.y * maxY, dw, dh)
      ctx.restore()
    } else {
      ctx.fillStyle = '#1a171f'
      ctx.fillRect(box.x, box.y, box.w, box.h)
    }

    const d = design.trim()
    const cl = client.trim()
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'

    if (layout === 'marco') {
      ctx.strokeStyle = 'rgba(243,236,224,.55)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(box.x + 16, box.y + 16, box.w - 32, box.h - 32)
      let y = 1098 + 72
      if (service) {
        ctx.fillStyle = C.gold
        ctx.font = `500 24px ${label}`
        ls('6px')
        ctx.fillText(service.toUpperCase(), 64, y)
        ls('0px')
        y += 70
      } else y += 30
      if (d) {
        ctx.fillStyle = C.ivory
        fit(d, s => `italic 500 ${s}px ${display}`, 74, 640)
        ctx.fillText(d, 62, y)
        y += 52
      }
      if (cl) {
        ctx.fillStyle = 'rgba(243,236,224,.7)'
        ctx.font = `500 32px ${display}`
        ctx.fillText('para ' + cl, 64, y)
      }
      drawLogo(1016, 1128, 190)
      star(1000, 82, 10)
    } else if (layout === 'completa') {
      const g = ctx.createLinearGradient(0, H * 0.55, 0, H)
      g.addColorStop(0, 'rgba(11,10,13,0)')
      g.addColorStop(1, 'rgba(11,10,13,.92)')
      ctx.fillStyle = g
      ctx.fillRect(0, H * 0.55, W, H * 0.45)
      let y = H - 70
      if (cl) {
        ctx.fillStyle = 'rgba(243,236,224,.78)'
        ctx.font = `500 32px ${display}`
        ctx.fillText('para ' + cl, 70, y)
        y -= 56
      }
      if (d) {
        ctx.fillStyle = C.ivory
        fit(d, s => `italic 500 ${s}px ${display}`, 84, 640)
        ctx.fillText(d, 66, y)
        y -= 76
      }
      if (service) {
        ctx.fillStyle = C.gold
        ctx.font = `500 24px ${label}`
        ls('6px')
        ctx.fillText(service.toUpperCase(), 70, y)
        ls('0px')
      }
      drawLogo(1010, H - 230, 170)
      star(1030, 52, 10)
    } else {
      const g = ctx.createRadialGradient(W - 130, H - 120, 10, W - 130, H - 120, 260)
      g.addColorStop(0, 'rgba(11,10,13,.55)')
      g.addColorStop(1, 'rgba(11,10,13,0)')
      ctx.fillStyle = g
      ctx.fillRect(W - 420, H - 400, 420, 400)
      drawLogo(W - 50, H - 200, 150)
      star(1030, 52, 10)
    }
  }, [design, service, client, layout, zoom, offset, version, photoBox, display, label])

  // Encuadre arrastrando
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    const pr = processedRef.current
    if (!drag || !pr) return
    const box = photoBox()
    const scale = W / e.currentTarget.getBoundingClientRect().width
    const s = Math.max(box.w / pr.width, box.h / pr.height) * zoom
    const maxX = Math.max(1, (pr.width * s - box.w) / 2)
    const maxY = Math.max(1, (pr.height * s - box.h) / 2)
    setOffset({
      x: Math.max(-1, Math.min(1, drag.ox + ((e.clientX - drag.x) * scale) / maxX)),
      y: Math.max(-1, Math.min(1, drag.oy + ((e.clientY - drag.y) * scale) / maxY)),
    })
  }
  const endDrag = () => {
    dragRef.current = null
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    try {
      setSource(await loadImage(url))
      setMsg('')
    } catch {
      setMsg('No se pudo abrir esa imagen. Prueba con una foto JPG o PNG.')
    } finally {
      URL.revokeObjectURL(url)
      e.target.value = ''
    }
  }

  const save = () => {
    const cv = canvasRef.current
    if (!cv) return
    setFallbackUrl(null)
    cv.toBlob(async blob => {
      if (!blob) {
        setMsg('No se pudo generar la imagen.')
        return
      }
      const name = fileName(design)
      const file = new File([blob], name, { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
          setMsg('')
          return
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return
        }
      }
      if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = name
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(a.href), 4000)
        setMsg('Listo, revisa tus descargas.')
        return
      }
      setFallbackUrl(URL.createObjectURL(blob))
      setMsg('')
    }, 'image/png')
  }

  const copyFooter = async () => {
    const ok = await copyText(footer)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else setMsg('No se pudo copiar. Mantén presionado el texto para copiarlo.')
  }

  const isRec = sameAdj(adj, RECOMENDADO)
  const isNone = sameAdj(adj, SIN_AJUSTES)

  const segBtn = (active: boolean) =>
    `rounded-xl py-2.5 text-sm font-semibold transition-colors ${
      active ? 'bg-pn-ink text-[#f3ece0]' : 'bg-pn-ivory text-pn-text active:bg-pn-line'
    }`
  const field = 'pn-input'
  const sectionTitle = 'pn-label text-pn-gold mb-3'

  return (
    <div className="space-y-5">
      <label className="flex items-center justify-center gap-2 w-full rounded-full bg-pn-ink text-[#f3ece0] font-bold py-3.5 cursor-pointer active:scale-[.99] transition-transform">
        <span>📷</span> Subir foto de la clienta
        <input type="file" accept="image/*" className="sr-only" onChange={onFile} />
      </label>

      {/* Vista previa fija arriba mientras se ajusta */}
      <div className="sticky top-[calc(env(safe-area-inset-top,0px)+80px)] z-30 -mx-4 px-4 pt-2 pb-3 bg-pn-ivory border-b border-pn-line">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="block mx-auto rounded-xl shadow-[0_10px_30px_rgba(16,14,19,0.25)] bg-[#0b0a0d] cursor-grab"
          style={{ height: 'min(40vh, 400px)', width: 'auto', aspectRatio: '4 / 5', maxWidth: '100%', touchAction: 'none' }}
          aria-label="Vista previa del post"
        />
        <p className="text-center text-xs text-pn-muted mt-2">Arrastra la foto para encuadrarla</p>
      </div>

      <section className="rounded-2xl bg-pn-paper border border-pn-line p-4 space-y-3">
        <h2 className={sectionTitle}>Texto</h2>
        <label className="block text-[13px] font-bold text-pn-text">
          Nombre del diseño
          <input className={field + ' mt-1.5'} value={design} maxLength={32} onChange={e => setDesign(e.target.value)} placeholder="Ej: French cromado" />
        </label>
        <label className="block text-[13px] font-bold text-pn-text">
          Servicio
          <select className={field + ' mt-1'} value={service} onChange={e => setService(e.target.value)}>
            <option value="Softgel">Softgel</option>
            <option value="Semipermanente">Semipermanente</option>
            <option value="">Sin servicio</option>
          </select>
        </label>
        <label className="block text-[13px] font-bold text-pn-text">
          Para (opcional)
          <input className={field + ' mt-1'} value={client} maxLength={24} onChange={e => setClient(e.target.value)} placeholder="Nombre de la clienta" />
        </label>
      </section>

      <section className="rounded-2xl bg-pn-paper border border-pn-line p-4">
        <h2 className={sectionTitle}>Estilo</h2>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ['marco', 'Marco'],
              ['completa', 'Completa'],
              ['firma', 'Solo logo'],
            ] as [Layout, string][]
          ).map(([k, t]) => (
            <button key={k} type="button" className={segBtn(layout === k)} aria-pressed={layout === k} onClick={() => setLayout(k)}>
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-pn-paper border border-pn-line p-4 space-y-4">
        <h2 className={sectionTitle}>Foto</h2>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={segBtn(isRec)} aria-pressed={isRec} onClick={() => setAdj(RECOMENDADO)}>
            Ajuste recomendado
          </button>
          <button type="button" className={segBtn(isNone)} aria-pressed={isNone} onClick={() => setAdj(SIN_AJUSTES)}>
            Sin ajustes
          </button>
        </div>
        <label className="block text-[13px] font-bold text-pn-text">
          <span className="flex justify-between">
            Zoom <span className="tabular-nums text-pn-muted font-semibold">{zoom.toFixed(1)}×</span>
          </span>
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(+e.target.value)} className="w-full accent-[#a8844b]" />
        </label>
        {ADJ_LABELS.map(({ key, label: t }) => (
          <label key={key} className="block text-[13px] font-bold text-pn-text">
            <span className="flex justify-between">
              {t}
              <span className="tabular-nums text-pn-muted font-semibold">
                {adj[key] > 0 ? '+' : ''}
                {adj[key]}
              </span>
            </span>
            <input
              type="range"
              min={-40}
              max={40}
              step={1}
              value={adj[key]}
              onChange={e => setAdj(a => ({ ...a, [key]: +e.target.value }))}
              className="w-full accent-[#a8844b]"
            />
          </label>
        ))}
      </section>

      <button type="button" onClick={save} className="w-full rounded-full bg-pn-ink text-[#f3ece0] font-bold py-4 shadow-[0_10px_30px_rgba(16,14,19,0.25)] active:scale-[.99] transition-transform">
        Guardar post
      </button>
      {msg && <p className="text-center text-sm text-pn-muted" role="status">{msg}</p>}
      {fallbackUrl && (
        <div className="text-center space-y-2">
          <p className="text-xs text-pn-muted">Mantén presionada la imagen para guardarla:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fallbackUrl} alt="Post listo para guardar" className="mx-auto max-w-[240px] rounded-lg" />
        </div>
      )}

      <section className="rounded-2xl bg-pn-paper border border-pn-line p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className={sectionTitle + ' mb-0'}>Footer del caption</h2>
          <span className="text-xs text-pn-muted">Hashtags de {service || 'diseño'}</span>
        </div>
        <pre className="whitespace-pre-wrap break-words rounded-xl bg-pn-ivory border border-pn-line p-3 text-[13px] leading-relaxed text-pn-text font-[inherit] select-all">
          {footer}
        </pre>
        <button
          type="button"
          onClick={copyFooter}
          className={`w-full rounded-full font-bold py-3.5 border-[1.5px] transition-colors ${
            copied ? 'bg-pn-ink text-[#f3ece0] border-pn-ink' : 'bg-white text-pn-text border-pn-ink'
          }`}
        >
          {copied ? '✓ Footer copiado' : 'Copiar footer'}
        </button>
        <p className="text-xs text-pn-muted">Pégalo al final del caption en Instagram. Los hashtags cambian según el servicio elegido.</p>
      </section>
    </div>
  )
}
