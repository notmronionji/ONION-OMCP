import http from 'node:http'
import https from 'node:https'
import { timingSafeEqual } from 'node:crypto'

const host = process.env.OMCP_GATEWAY_HOST || '127.0.0.1'
const port = Number(process.env.OMCP_GATEWAY_PORT || 6768)
const username = process.env.OMCP_USERNAME || 'admin'
const password = process.env.OMCP_PASSWORD || ''

if (!password) {
  console.error('OMCP gateway refused to start: OMCP_PASSWORD is missing.')
  process.exit(1)
}

function authorized(header = '') {
  if (!header.startsWith('Basic ')) return false
  let decoded
  try { decoded = Buffer.from(header.slice(6), 'base64').toString('utf8') } catch { return false }
  const split = decoded.indexOf(':')
  if (split < 0) return false
  const suppliedUser = Buffer.from(decoded.slice(0, split))
  const suppliedPass = Buffer.from(decoded.slice(split + 1))
  const expectedUser = Buffer.from(username)
  const expectedPass = Buffer.from(password)
  return suppliedUser.length === expectedUser.length &&
    suppliedPass.length === expectedPass.length &&
    timingSafeEqual(suppliedUser, expectedUser) &&
    timingSafeEqual(suppliedPass, expectedPass)
}

const server = http.createServer((req, res) => {
  if (!authorized(req.headers.authorization)) {
    res.writeHead(401, {
      'WWW-Authenticate': 'Basic realm="OMCP Panel", charset="UTF-8"',
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    })
    res.end('OMCP Panel login required.')
    return
  }

  const headers = { ...req.headers, host: '127.0.0.1:6767' }
  delete headers.authorization
  delete headers.cookie
  const upstream = http.request({
    hostname: '127.0.0.1',
    port: 6767,
    method: req.method,
    path: req.url,
    headers,
  }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers)
    upstreamRes.pipe(res)
  })
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain' })
    res.end('OMCP Panel preview is unavailable.')
  })
  req.pipe(upstream)
})

server.listen(port, host, () => {
  console.log(`OMCP authenticated gateway listening on http://${host}:${port}`)
})
