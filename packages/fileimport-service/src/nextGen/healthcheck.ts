import http from 'node:http'
import { Logger } from 'pino'

export const startHealthCheckServer = (params: { logger: Logger }) => {
  const { logger } = params
  const server = http.createServer((req, res) => {
    if (req.url === '/healthz' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('OK')
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not Found')
    }
  })

  server.listen(9080, '0.0.0.0', () => {
    logger.info('Server running, listening to 0.0.0.0 and path /healthz')
  })

  return server
}
