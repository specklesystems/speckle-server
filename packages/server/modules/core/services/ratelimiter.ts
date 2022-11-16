import express from 'express'

export const rateLimiterMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  next()
}
