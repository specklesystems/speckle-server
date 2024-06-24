import express from 'express'

const indexRouter = express.Router()
export default indexRouter

indexRouter.get('/', (_req, res) => {
  res.send('Speckle Object Preview Service')
})
