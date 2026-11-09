import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

const Compare = forwardRef(function Compare({ pair }, ref) {
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

  useImperativeHandle(ref, () => ({
    slide(clientX) {
      const rect = rootRef.current?.getBoundingClientRect()
      if (!rect?.width) return
      const next = ((clientX - rect.left) / rect.width) * 100
      setPos(Math.min(100, Math.max(0, next)))
    },
  }))

  return (
    <div
      ref={rootRef}
      className="compare"
      role="slider"
      tabIndex={0}
      aria-label="Сравнение фото и резьбы"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pos)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') setPos((value) => Math.max(0, value - 4))
        if (event.key === 'ArrowRight') setPos((value) => Math.min(100, value + 4))
      }}
    >
      <img
        src={pair.after}
        alt=""
        draggable="false"
        style={{
          objectPosition: pair.afterPosition,
          transform: pair.afterScale ? `scale(${pair.afterScale})` : undefined,
          transformOrigin: pair.afterOrigin,
        }}
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
    </div>
  )
})

export default Compare
