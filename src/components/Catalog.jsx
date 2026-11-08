import { useEffect, useRef, useState } from 'react'
import { products } from '../data.js'
import Compare from './Compare.jsx'
import ModelView from './ModelView.jsx'
import QrPanel from './QrPanel.jsx'
import Seal from './Seal.jsx'

function relIndex(index, active, count) {
  let delta = index - active
  if (delta > count / 2) delta -= count
  if (delta < -count / 2) delta += count
  return delta
}

export default function Catalog() {
  const [active, setActive] = useState(0)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [pairIndex, setPairIndex] = useState(0)
  const [mode, setMode] = useState('photo')
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [hint, setHint] = useState(true)
  const [metrics, setMetrics] = useState({ gap: 520, side: 0.56 })
  const stageRef = useRef(null)
  const dragRef = useRef(null)
  const activeRef = useRef(0)
  const metricsRef = useRef(metrics)

  activeRef.current = active
  metricsRef.current = metrics

  useEffect(() => {
    const node = stageRef.current
    if (!node) return undefined
    const read = () => {
      const style = getComputedStyle(node)
      const ratio = Number.parseFloat(style.getPropertyValue('--gap-ratio')) || 0.34
      const side = Number.parseFloat(style.getPropertyValue('--side-scale')) || 0.56
      setMetrics({
        gap: Math.max(220, node.clientWidth * ratio),
        side,
      })
    }
    read()
    const observer = new ResizeObserver(read)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    products.forEach((product) => {
      product.images.forEach((image) => {
        const preload = new Image()
        preload.src = image.src
      })
    })
  }, [])

  function openProduct(index) {
    const next = (index + products.length) % products.length
    activeRef.current = next
    setActive(next)
    setPhotoIndex(products[next].coverIndex || 0)
    setPairIndex(0)
    setMode('photo')
    setDrag(0)
  }

  function move(direction) {
    setHint(false)
    openProduct(activeRef.current + direction)
  }

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'ArrowRight') move(1)
      if (event.key === 'ArrowLeft') move(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function onPointerDown(event) {
    if (event.button != null && event.button !== 0) return
    if (event.target.closest('button, a, .compare, .model-view')) return
    dragRef.current = { x: event.clientX, moved: false }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event) {
    const origin = dragRef.current
    if (!origin) return
    const dx = event.clientX - origin.x
    if (Math.abs(dx) > 8) origin.moved = true
    setDrag(dx)
  }

  function onPointerUp(event) {
    const origin = dragRef.current
    if (!origin) return
    dragRef.current = null
    const dx = event.clientX - origin.x
    const card = event.target.closest?.('[data-card]')
    const threshold = Math.min(100, metricsRef.current.gap * 0.18)
    setDragging(false)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (dx <= -threshold) move(1)
        else if (dx >= threshold) move(-1)
        else if (card && !origin.moved) {
          const index = Number(card.dataset.card)
          setDrag(0)
          if (index !== activeRef.current) openProduct(index)
        } else setDrag(0)
      })
    })
  }

  function onPointerCancel() {
    dragRef.current = null
    setDragging(false)
    setDrag(0)
  }

  const product = products[active]
  const photo = product.images[photoIndex] || product.images[0]

  function pickPhoto(index) {
    setPhotoIndex(index)
    setMode('photo')
    if (!product.pairs) return
    const src = product.images[index].src
    const found = product.pairs.findIndex((pair) => pair.before === src || pair.after === src)
    if (found >= 0) setPairIndex(found)
  }

  return (
    <section className="catalog screen">
      <header className="topbar">
        <div className="brand">
          <Seal />
          <div>
            <p className="brand-kicker">Авторская мастерская</p>
            <p className="brand-name">Резьба</p>
          </div>
        </div>
        <div className="contact-block">
          <p>Изделия ручной работы на заказ</p>
          <p>Иконы, гербы и портреты · заказ по QR-коду</p>
        </div>
      </header>

      <div
        className={dragging ? 'stage dragging' : 'stage'}
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {products.map((item, index) => {
          const slot = relIndex(index, active, products.length) + drag / metrics.gap
          const dist = Math.min(Math.abs(slot), 1)
          const scale = 1 - dist * (1 - metrics.side)
          const isActive = index === active
          const frame = isActive ? photo : item.images[item.coverIndex]
          return (
            <article
              key={item.id}
              data-card={index}
              className={isActive ? 'card is-active' : 'card'}
              style={{
                transform: `translate(-50%, -50%) translateX(${slot * metrics.gap}px) scale(${scale})`,
                zIndex: 12 - Math.round(dist * 8),
              }}
            >
              <div className="circle">
                <div
                  className="media"
                  style={
                    dist > 0.04
                      ? {
                          filter: `blur(${dist * 2.4}px) brightness(${1 + dist * 0.28}) saturate(${1 - dist * 0.3})`,
                        }
                      : undefined
                  }
                >
                  {isActive && mode === 'model' ? (
                    <ModelView url={item.model} />
                  ) : isActive && mode === 'compare' && item.pairs ? (
                    <Compare pair={item.pairs[pairIndex]} />
                  ) : (
                    <img
                      src={frame.src}
                      alt={frame.alt}
                      draggable="false"
                      style={{ objectPosition: frame.position }}
                    />
                  )}
                </div>
                <div className="veil" style={{ opacity: dist * 0.5 }} />
                <div className="ring" />
              </div>

              {!isActive && <p className="side-label">{shortTitle(item)}</p>}

              {isActive && item.pairs && (
                <div className="rail rail-left">
                  {item.pairs.map((pair, pairAt) => (
                    <button
                      key={pair.name}
                      type="button"
                      className={mode === 'compare' && pairIndex === pairAt ? 'pair-btn on' : 'pair-btn'}
                      onClick={() => {
                        setPairIndex(pairAt)
                        setMode('compare')
                      }}
                    >
                      {pair.name}
                    </button>
                  ))}
                </div>
              )}

              {isActive && (
                <div className="rail rail-right">
                  {item.images.map((image, imageAt) => (
                    <button
                      key={image.src}
                      type="button"
                      className={mode === 'photo' && photoIndex === imageAt ? 'thumb on' : 'thumb'}
                      aria-label={image.alt}
                      onClick={() => pickPhoto(imageAt)}
                    >
                      <img src={image.src} alt="" draggable="false" style={{ objectPosition: image.position }} />
                    </button>
                  ))}
                  {item.pairs && (
                    <button
                      type="button"
                      className={mode === 'compare' ? 'tool-btn on' : 'tool-btn'}
                      aria-pressed={mode === 'compare'}
                      onClick={() => setMode((value) => (value === 'compare' ? 'photo' : 'compare'))}
                    >
                      <SplitIcon />
                      <span>Шторка</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className={mode === 'model' ? 'tool-btn on' : 'tool-btn'}
                    aria-pressed={mode === 'model'}
                    aria-label="Показать 3D-модель"
                    onClick={() => setMode((value) => (value === 'model' ? 'photo' : 'model'))}
                  >
                    <CubeIcon />
                    <span>3D</span>
                  </button>
                </div>
              )}
            </article>
          )
        })}

        <div className="meta" key={`title-${product.id}`}>
          <h1>{product.title}</h1>
          <p className="detail">{product.detail}</p>
        </div>
        <p className="handmade" key={`note-${product.id}`}>
          Ручная работа
          <br />
          на заказ
        </p>

        <QrPanel key={`qr-${product.id}`} />
      </div>

      <footer className="pager">
        <div className="dots" role="tablist" aria-label="Изделия">
          {products.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === active ? 'dot on' : 'dot'}
              aria-label={item.title}
              onClick={() => {
                setHint(false)
                openProduct(index)
              }}
            />
          ))}
        </div>
        {hint && <p className="hint">Смахните, чтобы листать</p>}
      </footer>
    </section>
  )
}

function shortTitle(item) {
  if (item.id === 'icon') return 'Икона'
  if (item.id === 'emblem') return 'Герб'
  return 'Портрет'
}

function CubeIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M16 4.5 27 10v12L16 27.5 5 22V10L16 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M16 15.2 27 10M16 15.2 5 10M16 15.2V27.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function SplitIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="4" y="6" width="24" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 6v20" stroke="currentColor" strokeWidth="1.7" />
      <path d="M11 14.5 8.5 16 11 17.5M21 14.5 23.5 16 21 17.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
