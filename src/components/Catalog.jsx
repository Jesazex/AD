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
  const [metrics, setMetrics] = useState({ gap: 720, side: 0.98 })
  const stageRef = useRef(null)
  const compareRef = useRef(null)
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
      const side = Number.parseFloat(style.getPropertyValue('--side-scale')) || 0.98
      const card = node.querySelector('.card')
      const fallback = Number.parseFloat(style.getPropertyValue('--gap-ratio')) || 0.86
      setMetrics({
        gap: Math.max(240, card?.offsetHeight || node.clientHeight * fallback),
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
    const item = products[next]
    const cover = item.coverIndex || 0
    const pairAt = item.pairs?.findIndex((pair) => pair.after === item.images[cover]?.src) ?? 0
    activeRef.current = next
    setActive(next)
    setPhotoIndex(cover)
    setPairIndex(pairAt < 0 ? 0 : pairAt)
    setMode((current) => (current === 'model' ? 'model' : item.pairs ? 'compare' : 'photo'))
    setDrag(0)
  }

  function move(direction) {
    setHint(false)
    openProduct(activeRef.current + direction)
  }

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'ArrowDown') move(1)
      if (event.key === 'ArrowUp') move(-1)
    }
    let locked = false
    const onWheel = (event) => {
      if (event.target.closest('button, a, .topbar, .model-view, .qr-pop, .qr-scrim')) return
      event.preventDefault()
      if (locked || Math.abs(event.deltaY) < 12) return
      locked = true
      move(event.deltaY > 0 ? 1 : -1)
      window.setTimeout(() => {
        locked = false
      }, 700)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
    }
  }, [])

  function onPointerDown(event) {
    if (event.button != null && event.button !== 0) return
    if (event.target.closest('button, a, .topbar, .model-view, .qr-pop, .qr-scrim')) return
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      moved: false,
      mode: null,
      onCompare: Boolean(event.target.closest('.compare')),
    }
    if (!event.target.closest('.compare')) {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }

  function onPointerMove(event) {
    const origin = dragRef.current
    if (!origin) return
    const dx = event.clientX - origin.x
    const dy = event.clientY - origin.y
    if (!origin.mode) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      origin.mode = origin.onCompare && Math.abs(dx) > Math.abs(dy) ? 'slide' : 'scroll'
      if (origin.mode === 'scroll') {
        setDragging(true)
        event.currentTarget.setPointerCapture(event.pointerId)
      }
    }
    if (origin.mode === 'slide') {
      compareRef.current?.slide(event.clientX)
      return
    }
    if (Math.abs(dy) > 8) origin.moved = true
    setDrag(dy)
  }

  function onPointerUp(event) {
    const origin = dragRef.current
    if (!origin) return
    dragRef.current = null
    if (origin.mode === 'slide') {
      setDragging(false)
      return
    }
    const dy = event.clientY - origin.y
    const card = event.target.closest?.('[data-card]')
    const threshold = Math.min(90, metricsRef.current.gap * 0.14)
    setDragging(false)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (dy <= -threshold) move(1)
        else if (dy >= threshold) move(-1)
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

  const tiles = tileThumbs(product)

  return (
    <section
      className="catalog screen"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <header className="topbar">
        <div className="brand">
          <Seal />
          <div>
            <p className="brand-kicker">Авторская мастерская</p>
            <p className="brand-name">Резьба</p>
          </div>
        </div>
        <div className="meta" key={`title-${product.id}`}>
          <h1>{product.title}</h1>
          <p className="detail">{product.detail}</p>
        </div>
      </header>

      <div className={dragging ? 'stage dragging' : 'stage'} ref={stageRef}>
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
                transform: `translate(-50%, -50%) translateY(${slot * metrics.gap}px) scale(${scale})`,
                zIndex: 12 - Math.round(dist * 8),
              }}
            >
              <div className="frame">
                <div
                  className="media"
                  style={
                    dist > 0.04
                      ? {
                          filter: `blur(${dist * 0.6}px) brightness(${1 + dist * 0.06}) saturate(${1 - dist * 0.08})`,
                        }
                      : undefined
                  }
                >
                  {isActive && mode === 'model' ? (
                    <ModelView url={item.model} />
                  ) : isActive && mode === 'compare' && item.pairs ? (
                    <Compare ref={compareRef} pair={item.pairs[pairIndex]} />
                  ) : (
                    <img
                      src={frame.src}
                      alt={frame.alt}
                      draggable="false"
                      style={{ objectPosition: frame.position }}
                    />
                  )}
                </div>
                <div className="veil" style={{ opacity: dist * 0.16 }} />
                <div className="ring" />
              </div>
            </article>
          )
        })}
        <aside className="rail rail-left">
          <QrPanel key={`qr-${product.id}`} />
        </aside>
        <aside className="rail rail-right">
          {tiles.map(({ image, index, pairAt }) => (
            <button
              key={image.src}
              type="button"
              className={mode !== 'model' && pairIndex === pairAt ? 'thumb on' : 'thumb'}
              aria-label={image.alt}
              onClick={() => {
                setPhotoIndex(index)
                setPairIndex(pairAt)
                setMode((value) => (value === 'model' ? 'model' : 'compare'))
              }}
            >
              <img src={image.src} alt="" draggable="false" style={{ objectPosition: image.position }} />
            </button>
          ))}
          <button
            type="button"
            className={mode === 'model' ? 'tool-btn on' : 'tool-btn'}
            aria-pressed={mode === 'model'}
            aria-label="Показать 3D-модель"
            onClick={() => setMode((value) => (value === 'model' ? (product.pairs ? 'compare' : 'photo') : 'model'))}
          >
            <CubeIcon />
            <span>3D</span>
          </button>
        </aside>
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
        {hint && <p className="hint">Смахните вверх или вниз</p>}
      </footer>
    </section>
  )
}

function tileThumbs(product) {
  if (!product.pairs?.length) return []
  return product.pairs.flatMap((pair, pairAt) => {
    const index = product.images.findIndex((image) => image.src === pair.after)
    if (index < 0) return []
    return [{ image: product.images[index], index, pairAt }]
  })
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

