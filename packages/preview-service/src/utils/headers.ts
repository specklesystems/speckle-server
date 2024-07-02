import express from 'express'

const isSimpleTextRequested = (req: express.Request) =>
  req.headers.accept === 'text/plain'

export const simpleTextOrJsonContentType = (req: express.Request) =>
  isSimpleTextRequested(req) ? 'text/plain' : 'application/json'
