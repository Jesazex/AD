import { useEffect, useState } from 'react'
import { asset, products } from '../data.js'
import Seal from './Seal.jsx'

const INTRO_SOURCES = [asset('intro.mp4'), asset('intro.webm')]

async function findIntroVideo() {
  for (const src of INTRO_SOURCES) {
    try {
      const response = await fetch(src, {
        headers: { Range: 'bytes=0-15' },
        cache: 'no-store',
      })
      if (!response.ok && response.status !== 206) continue
      const type = (response.headers.get('content-type') || '').toLowerCase()
      if (type.includes('text/html')) continue
      const bytes = new Uint8Array(await response.arrayBuffer())
      const mark = String.fromCharCode(...bytes.slice(4, 8))
      const isMp4 = mark === 'ftyp'
      const isWebm = bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3
      if (isMp4 || isWebm || type.startsWith('video/')) return src
    } catch {
      /* файла нет — остаётся рисованная заставка */
    }
  }
  return null
}

export default function Splash({ attract, onEnter }) {
  const [video, setVideo] = useState(undefined)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    findIntroVideo().then((src) => {
      if (!cancelled) setVideo(src)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (video && !failed) {
    return <VideoSplash src={video} attract={attract} onEnter={onEnter} onFail={() => setFailed(true)} />
  }

  if (video === undefined && !failed) {
    return <div className="splash splash-blank" />
  }

  return <TitleSplash attract={attract} onEnter={onEnter} />
}

function VideoSplash({ src, attract, onEnter, onFail }) {
  return (
    <section className="splash splash-video" onClick={onEnter}>
      <video
        src={src}
        autoPlay
        muted
        playsInline
        loop={attract}
        onEnded={() => {
          if (!attract) onEnter()
        }}
        onError={onFail}
      />
      <div className="splash-shade" />
      <button type="button" className="enter-btn" onClick={onEnter}>
        В каталог
      </button>
    </section>
  )
}

function TitleSplash({ attract, onEnter }) {
  useEffect(() => {
    if (attract) return undefined
    const timer = window.setTimeout(onEnter, 7600)
    return () => window.clearTimeout(timer)
  }, [attract, onEnter])

  return (
    <section className="splash title-splash" onClick={onEnter}>
      <div className="splash-copy">
        <Seal />
        <p className="splash-kicker">Авторская мастерская</p>
        <h1>Резьба по дереву</h1>
        <p className="splash-lead">Иконы, гербы и портреты на заказ</p>
      </div>
      <div className="splash-row">
        {products.map((product) => (
          <figure key={product.id}>
            <img
              src={product.images[product.coverIndex].src}
              alt=""
              draggable="false"
            />
          </figure>
        ))}
      </div>
      <button type="button" className="enter-btn" onClick={onEnter}>
        {attract ? 'Коснитесь экрана' : 'Открыть каталог'}
      </button>
    </section>
  )
}
