import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { ORDER_URL } from '../data.js'

export default function QrPanel() {
  const [open, setOpen] = useState(false)
  const [image, setImage] = useState('')

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(ORDER_URL, {
      width: 360,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#142033', light: '#ffffff' },
    }).then((url) => {
      if (!cancelled) setImage(url)
    })
    return () => {
      cancelled = true
    }
  }, [])

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
      {open && (
        <div className="qr-pop">
          {image ? <img src={image} alt="QR-код для заказа" /> : <span className="qr-wait">Код</span>}
          <span className="qr-caption">Наведите камеру</span>
        </div>
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
