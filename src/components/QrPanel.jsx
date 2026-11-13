import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { QR_LINKS } from '../data.js'

export default function QrPanel() {
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState({})

  useEffect(() => {
    let cancelled = false
    Promise.all(
      QR_LINKS.map(async (item) => {
        const url = await QRCode.toDataURL(item.url, {
          width: 520,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#000000', light: '#ffffff' },
        })
        return [item.id, url]
      }),
    ).then((entries) => {
      if (!cancelled) setImages(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className={open ? 'qr-dock open' : 'qr-dock'}>
      <button
        type="button"
        className="qr-card"
        aria-label="Купить"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <QrGlyph />
        <span>Купить</span>
      </button>
      {open &&
        createPortal(
          <>
            <button type="button" className="qr-scrim" aria-label="Закрыть" onClick={() => setOpen(false)} />
            <div className="qr-pop" role="dialog" aria-label="Где купить">
              {QR_LINKS.map((item) => (
                <figure className="qr-item" key={item.id}>
                  <figcaption>{item.caption}</figcaption>
                  <div className="qr-plate">
                    <div className={item.center ? 'qr-plate-head is-center' : 'qr-plate-head'}>
                      {item.brand ? <span>{item.brand}</span> : null}
                      <span>{item.title}</span>
                    </div>
                    <div className="qr-plate-code">
                      {images[item.id] ? (
                        <img src={images[item.id]} alt="" />
                      ) : (
                        <span className="qr-wait">Код</span>
                      )}
                    </div>
                  </div>
                </figure>
              ))}
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}

function QrGlyph() {
  return (
    <svg className="qr-glyph" viewBox="0 0 48 48" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <rect x="8" y="8" width="8" height="8" fill="currentColor" />
      <rect x="28" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <rect x="32" y="8" width="8" height="8" fill="currentColor" />
      <rect x="4" y="28" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <rect x="8" y="32" width="8" height="8" fill="currentColor" />
      <rect x="28" y="28" width="6" height="6" fill="currentColor" />
      <rect x="36" y="28" width="8" height="6" fill="currentColor" />
      <rect x="28" y="36" width="8" height="8" fill="currentColor" />
      <rect x="38" y="38" width="6" height="6" fill="currentColor" />
    </svg>
  )
}
