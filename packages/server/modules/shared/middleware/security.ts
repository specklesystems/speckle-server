import type express from 'express'

export const crossOriginResourcePolicyMiddleware =
  (value: 'same-origin' | 'cross-origin' | 'same-site'): express.RequestHandler =>
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', value)
    next()
  }
