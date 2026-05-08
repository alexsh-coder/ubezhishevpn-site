import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import app from './dist/server/server.js'

const port = process.env.PORT || 3000
const clientDir = './dist/client'

const mimeTypes = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

createServer(async (req, res) => {
  const filePath = join(clientDir, req.url.split('?')[0])
  if (existsSync(filePath)) {
    const info = await stat(filePath)
    if (info.isFile()) {
      const ext = extname(filePath)
      const mime = mimeTypes[ext] || 'application/octet-stream'
      const content = await readFile(filePath)
      res.writeHead(200, { 'Content-Type': mime })
      res.end(content)
      return
    }
  }

  const url = new URL(req.url, `http://${req.headers.host}`)
  const headers = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers[key] = value
  }

  const request = new Request(url, { method: req.method, headers })
  const response = await app.fetch(request)

  res.writeHead(response.status, Object.fromEntries(response.headers.entries()))
  const text = await response.text()
  res.end(text)
}).listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})