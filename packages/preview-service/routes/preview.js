'use strict'

var express = require( 'express' )
var router = express.Router()
const puppeteer = require( 'puppeteer' )

function sleep( ms ) {
  return new Promise( ( resolve ) => {
    setTimeout( resolve, ms )
  } )
}

async function getScreenshot( objectUrl ) {
  let launchParams = { args: [ '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage' ] }
  // if ( process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true' ) {
  //   launchParams.executablePath = 'chromium'
  // }
  const browser = await puppeteer.launch( launchParams )
  const page = await browser.newPage()
  await page.goto( 'http://127.0.0.1:3001/render/' )

  console.log("Page loaded")

  console.time( 'lo' )
  const scr = await page.evaluate( async ( objectUrl ) => {
    waitForAnimation = async ( ms=70 ) => await new Promise( ( resolve ) => {
      setTimeout( resolve, ms )
    } )
    let scr = {}
    let stepAngle = 0.261799
    v.postprocessing = false
    v.sceneManager.skipPostLoad = true
    try {
      await v.loadObject( objectUrl, '' )
    } catch ( error ) {
      // Main call failed. Wait some time for other objects to load inside the viewer and generate the preview anyway
      await waitForAnimation( 1000 )
    }
    
    v.interactions.zoomExtents( 0.95, false )
    await waitForAnimation()
    scr['0'] = v.interactions.screenshot()

    for ( let i = 1; i < 3; i++ ) {
      v.interactions.rotateCamera( stepAngle, undefined, false )
      await waitForAnimation()
      scr[( -1 * i ) + ''] = v.interactions.screenshot()
    }
    v.interactions.rotateCamera( -2 * stepAngle, undefined, false )
    await waitForAnimation()
    for ( let i = 1; i < 3; i++ ) {
      v.interactions.rotateCamera( -1 * stepAngle, undefined, false )
      await waitForAnimation()
      scr[i + ''] = v.interactions.screenshot()
    }
    /*
    v.interactions.rotateCamera( 2 * stepAngle, transition=false )
    await waitForAnimation( 500 )

    let dirArray = [ 'top', 'bottom', 'front', 'back', 'left', 'right' ]
    for ( let i in dirArray ) {
      let d = dirArray[i]
      v.interactions.rotateTo( d )
      await waitForAnimation()
      scr[d] = v.interactions.screenshot()
    }
    */
    return scr
  }, objectUrl )

  
  // Don't await for cleanup
  browser.close()

  return scr

  return `
  <html><body>
  <img height="200px" src="${scr['-2']}" /><br />
  <img height="200px" src="${scr['-1']}" /><br />
  <img height="200px" src="${scr['0']}" /><br />
  <img height="200px" src="${scr['1']}" /><br />
  <img height="200px" src="${scr['2']}" /><br />
  </body></html>
  `

  const imageBuffer = new Buffer.from( b64Image.replace( /^data:image\/\w+;base64,/, '' ), 'base64' )

  console.timeEnd( 'lo' )

  // await page.waitForTimeout(500);
  //var response = await page.screenshot({
  //  type: 'png',
  //  clip: {x: 0, y: 0, width: 800, height: 800}
  //});

  return imageBuffer
};


router.get( '/:streamId/:objectId', async function( req, res, next ) {
  let objectUrl = `http://127.0.0.1:3001/streams/${req.params.streamId}/objects/${req.params.objectId}`
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

  console.log( objectUrl )
  console.time( 'test' )
  let scr = await getScreenshot( objectUrl )
  console.timeEnd( 'test' )
  // res.setHeader( 'content-type', 'image/png' )
  res.send( scr )
} )

module.exports = router
