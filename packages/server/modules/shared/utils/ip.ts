import { Optional } from '@speckle/shared'
import type express from 'express'
import type http from 'http'

export const getIpFromRequest = (req: express.Request | http.IncomingMessage) => {
  let ip: Optional<string> = undefined
  try {
    ip = (req.headers['cf-connecting-ip'] ||
      req.headers['true-client-ip'] ||
      req.headers['x-real-ip'] ||
      req.headers['x-forwarded-for'] ||
      req.headers['x-original-forwarded-for'] ||
      ('ip' in req ? req.ip : undefined) ||
      req.connection.remoteAddress ||
      '') as string
  } catch {
    ip = ''
  }
  const ignorePrefixes = ['192.168.', '10.', '127.', '172.1', '172.2', '172.3', '::']

  for (const ipPrefix of ignorePrefixes)
    if (ip.startsWith(ipPrefix) || ip === '') return null
  return ip
}
