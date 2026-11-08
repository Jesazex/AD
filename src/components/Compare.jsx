import { useEffect, useRef, useState } from 'react'

export default function Compare({ pair }) {
  const rootRef = useRef(null)
  const [pos, setPos] = useState(54)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = rootRef.current
    if (!el) return undefined
    const measure = () => {
      const rect = el.getBoundingClientRect()
      setSize({ width: rect.width, height: rect.height })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function setFromEvent(event) {
    const rect = rootRef.current.getBoundingClientRect()
    const next = ((event.clientX - rect.left) / rect.width) * 100
    setPos(Math.min(88, Math.max(12, next)))
  }

  function onPointerDown(event) {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    setFromEvent(event)
  }

  return (
    <div
      ref={rootRef}
      className="compare"
      role="slider"
      tabIndex={0}
      aria-label="Сравнение фото и резьбы"
      aria-valuemin={12}
      aria-valuemax={88}
      aria-valuenow={Math.round(pos)}
      onPointerDown={onPointerDown}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) setFromEvent(event)
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') setPos((value) => Math.max(12, value - 4))
        if (event.key === 'ArrowRight') setPos((value) => Math.min(88, value + 4))
      }}
    >
      <img
        src={pair.after}
        alt=""
        draggable="false"
        style={{ objectPosition: pair.afterPosition }}
      />
      <div className="compare-clip" style={{ width: `${pos}%` }}>
        <img
          src={pair.before}
          alt=""
          draggable="false"
          style={{
            width: size.width || '100%',
            height: size.height || '100%',
            objectPosition: pair.beforePosition,
          }}
        />
      </div>
      <div className="compare-line" style={{ left: `${pos}%` }} />
      <div className="compare-handle" style={{ left: `${pos}%` }}>
        <span />
        <span />
      </div>
      <span className="compare-tag left">Фото</span>
      <span className="compare-tag right">Резьба</span>
    </div>
  )
}
