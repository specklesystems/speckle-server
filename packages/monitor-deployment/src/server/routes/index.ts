import express from 'express'

const indexRouterFactory = () => {
  const indexRouter = express.Router()

  indexRouter.get('/', (_req, res) => {
    res.send('Speckle database monitoring, at your service.')
  })

  return indexRouter
}

export default indexRouterFactory
