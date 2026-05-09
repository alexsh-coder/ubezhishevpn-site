import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { join, extname } from 'node:path'

// Load .env.local BEFORE importing the app — server functions read process.env at module init
function loadEnvLocal(path) {
  try {
    const lines = readFileSync(path, 'utf8').split('\n')
    for (const line of lines) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const idx = t.indexOf('=')
      if (idx === -1) continue
      const key = t.slice(0, idx).trim()
      const raw = t.slice(idx + 1).trim()
      const val = raw.replace(/^["']|["']$/g, '') // strip optional quotes
      if (key && !(key in process.env)) process.env[key] = val
    }
  } catch {}
}

loadEnvLocal('.env.local')

// Dynamic import so env vars are already set when the server module initialises
const { default: app } = await import('./dist/server/server.js')

const port = process.env.PORT || 3000
const clientDir = './dist/client'

const mimeTypes = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
  '.webp': 'image/webp',
}

createServer(async (req, res) => {
  // Serve static assets from dist/client
  const filePath = join(clientDir, req.url.split('?')[0])
  if (existsSync(filePath)) {
    try {
      const info = await stat(filePath)
      if (info.isFile()) {
        const ext = extname(filePath)
        const mime = mimeTypes[ext] || 'application/octet-stream'
        const content = await readFile(filePath)
        res.writeHead(200, { 'Content-Type': mime })
        res.end(content)
        return
      }
    } catch {}
  }

  // Pass everything else to the TanStack Start SSR handler
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const headers = {}
    for (const [k, v] of Object.entries(req.headers)) {
      if (v !== undefined) headers[k] = Array.isArray(v) ? v.join(', ') : v
    }

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
    let body
    if (hasBody) {
      body = await new Promise((resolve) => {
        const chunks = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', () => resolve(Buffer.concat(chunks)))
      })
    }

    const request = new Request(url, { method: req.method, headers, body: body || null })
    const response = await app.fetch(request)

    const outHeaders = {}
    response.headers.forEach((v, k) => { outHeaders[k] = v })
    res.writeHead(response.status, outHeaders)

    // Stream the body correctly (handles both text and binary)
    const buf = await response.arrayBuffer()
    res.end(Buffer.from(buf))
  } catch (err) {
    console.error('Request error:', err)
    res.writeHead(500)
    res.end('Internal Server Error')
  }
}).listen(port, () => {
  console.log(`УбежищеVPN server running on http://localhost:${port}`)
})
