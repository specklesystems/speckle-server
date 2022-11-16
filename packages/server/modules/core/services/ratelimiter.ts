import express from 'express'

export const rateLimiterMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  await delay(1000).then(() => next())
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
