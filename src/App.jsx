import { useEffect, useState } from 'react'
import Catalog from './components/Catalog.jsx'
import Splash from './components/Splash.jsx'
import { ATTRACT_VIDEO } from './data.js'

const IDLE_MS = 30000

export default function App() {
  const [screen, setScreen] = useState('intro')

  useEffect(() => {
    const block = (event) => event.preventDefault()
    document.addEventListener('contextmenu', block)
    return () => document.removeEventListener('contextmenu', block)
  }, [])

  useEffect(() => {
    const preload = document.createElement('video')
    preload.preload = 'auto'
    preload.muted = true
    preload.playsInline = true
    preload.src = ATTRACT_VIDEO
    preload.load()
    return () => {
      preload.removeAttribute('src')
      preload.load()
    }
  }, [])

  useEffect(() => {
    if (screen !== 'catalog') return undefined
    let timer = window.setTimeout(() => setScreen('attract'), IDLE_MS)
    const reset = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setScreen('attract'), IDLE_MS)
    }
    window.addEventListener('pointerdown', reset)
    window.addEventListener('keydown', reset)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pointerdown', reset)
      window.removeEventListener('keydown', reset)
    }
  }, [screen])

  return (
    <div className="app">
      <Backdrop />
      {screen === 'catalog' ? (
        <Catalog key="catalog" />
      ) : (
        <Splash
          key={screen}
          attract={screen === 'attract'}
          onEnter={() => setScreen('catalog')}
        />
      )}
    </div>
  )
}

function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <svg className="flourish flourish-tl" viewBox="0 0 280 280">
        <Flourish />
      </svg>
      <svg className="flourish flourish-tr" viewBox="0 0 280 280">
        <Flourish />
      </svg>
      <svg className="flourish flourish-bl" viewBox="0 0 280 280">
        <Flourish />
      </svg>
      <svg className="flourish flourish-br" viewBox="0 0 280 280">
        <Flourish />
      </svg>
    </div>
  )
}

function Flourish() {
  return (
    <g fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round">
      <path d="M28 86c28-8 42 18 38 40-6 30-40 28-52 6" />
      <path d="M46 78c22 18 18 48-8 62" />
      <path d="M70 52c18 8 34 28 30 52-4 22-24 30-40 22" />
      <path d="M96 40c8 24 4 46-14 64" />
      <path d="M34 118c20 10 46 8 62-8 14-14 18-34 8-48" />
      <path d="M112 72c-16 20-14 46 6 62" />
      <circle cx="58" cy="96" r="3" fill="#ffffff" stroke="none" />
      <circle cx="92" cy="64" r="2" fill="#ffffff" stroke="none" />
    </g>
  )
}
