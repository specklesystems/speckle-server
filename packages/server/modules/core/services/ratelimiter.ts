import express from 'express'

export const rateLimiterMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  next()
}
