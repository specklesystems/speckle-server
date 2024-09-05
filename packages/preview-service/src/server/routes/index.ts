import express from 'express'

const indexRouterFactory = () => {
  const indexRouter = express.Router()

  indexRouter.get('/', (_req, res) => {
    res.send('Speckle Object Preview Service')
  })

  return indexRouter
}

export default indexRouterFactory
