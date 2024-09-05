import express from 'express'

export const isSimpleTextRequested = (req: express.Request) =>
  req.headers.accept === 'text/plain'

export const simpleTextOrJsonContentType = (req: express.Request) =>
  isSimpleTextRequested(req) ? 'text/plain' : 'application/json'
