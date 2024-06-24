'use strict'

import express from 'express'
import { getScreenshot } from '../../services/screenshot'
import { PuppeteerClient } from '../../clients/puppeteer'
import { puppeteerDriver } from '../../scripts/puppeteerDriver'
import { serviceUrl } from '../../utils/env'

const previewRouter = express.Router()
export default previewRouter

previewRouter.get('/:streamId/:objectId', async function (req, res) {
  const { streamId, objectId } = req.params || {}
  const safeParamRgx = /^[\w]+$/i
  if (!safeParamRgx.test(streamId) || !safeParamRgx.test(objectId)) {
    return res.status(400).json({ error: 'Invalid streamId or objectId!' })
  }
  const boundLogger = req.log.child({ streamId, objectId })

  const objectUrl = `${serviceUrl()}/streams/${req.params.streamId}/objects/${
    req.params.objectId
  }`
  /*
  let authToken = ''
  let authorizationHeader = req.header( 'Authorization' )
  if ( authorizationHeader && authorizationHeader.toLowerCase().startsWith( 'bearer ' ) ) {
    authToken = authorizationHeader.Substring( 'Bearer '.Length ).Trim()
  }
  // useful for testing (not the recommended way of passing the auth token)
  if ( req.query.authToken ) {
    authToken = req.query.authToken
  }
  */

  boundLogger.info('Requesting screenshot.')

  const puppeteerClient = new PuppeteerClient()

  const pageToOpenUrl = `${serviceUrl()}/render/`

  const scr = await getScreenshot({
    puppeteerClient,
    pageToOpenUrl,
    puppeteerFunctionToEvaluateInBrowser: puppeteerDriver,
    objectUrl,
    boundLogger
  })

  if (!scr) {
    return res.status(500).end()
  }

  // res.setHeader( 'content-type', 'image/png' )
  res.send(scr)
})
