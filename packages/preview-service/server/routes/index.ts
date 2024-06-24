import express from 'express'

export const router = express.Router()

router.get('/', (_req, res) => {
  res.send('Speckle Object Preview Service')
})
