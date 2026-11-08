import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist')
const port = Number(process.env.PORT) || 4178

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

function safeFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0])
  const rel = decoded === '/' ? '/index.html' : decoded
  const file = path.resolve(root, `.${rel}`)
  if (file !== root && !file.startsWith(root + path.sep)) return null
  return { file, rel }
}

function sendFile(req, res, file) {
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      const ext = path.extname(file).toLowerCase()
      if (ext && ext !== '.html') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Not found')
        return
      }
      const fallback = path.join(root, 'index.html')
      fs.readFile(fallback, (fallbackErr, html) => {
        if (fallbackErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
          res.end('Not found')
          return
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(html)
      })
      return
    }

    const type = types[path.extname(file).toLowerCase()] || 'application/octet-stream'
    const range = req.headers.range
    if (range) {
      const match = /bytes=(\d+)-(\d*)/.exec(range)
      if (!match) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` })
        res.end()
        return
      }
      const start = Number(match[1])
      const end = match[2] ? Number(match[2]) : Math.min(start + 1024 * 1024 - 1, stat.size - 1)
      if (start >= stat.size || end < start) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` })
        res.end()
        return
      }
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      })
      fs.createReadStream(file, { start, end }).pipe(res)
      return
    }

    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    })
    fs.createReadStream(file).pipe(res)
  })
}

const server = http.createServer((req, res) => {
  let located
  try {
    located = safeFile(req.url || '/')
  } catch {
    res.writeHead(400)
    res.end()
    return
  }
  if (!located) {
    res.writeHead(403)
    res.end()
    return
  }
  sendFile(req, res, located.file)
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Kiosk server http://127.0.0.1:${port}`)
})
