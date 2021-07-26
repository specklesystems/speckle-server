'use strict'

var express = require( 'express' )
var router = express.Router()
const puppeteer = require( 'puppeteer' )

function sleep( ms ) {
  return new Promise( ( resolve ) => {
    setTimeout( resolve, ms )
  } )
}

async function pageFunction( objectUrl ) {
  waitForAnimation = async ( ms=70 ) => await new Promise( ( resolve ) => {
    setTimeout( resolve, ms )
  } )
  let ret = {
    duration: 0,
    mem: 0,
    scr: {}
  }

  let t0 = Date.now()
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
  ret.scr['0'] = v.interactions.screenshot()

  for ( let i = 1; i < 3; i++ ) {
    v.interactions.rotateCamera( stepAngle, undefined, false )
    await waitForAnimation()
    ret.scr[( -1 * i ) + ''] = v.interactions.screenshot()
  }
  v.interactions.rotateCamera( -2 * stepAngle, undefined, false )
  await waitForAnimation()
  for ( let i = 1; i < 3; i++ ) {
    v.interactions.rotateCamera( -1 * stepAngle, undefined, false )
    await waitForAnimation()
    ret.scr[i + ''] = v.interactions.screenshot()
  }
  /*
  v.interactions.rotateCamera( 2 * stepAngle, transition=false )
  await waitForAnimation( 500 )

  let dirArray = [ 'top', 'bottom', 'front', 'back', 'left', 'right' ]
  for ( let i in dirArray ) {
    let d = dirArray[i]
    v.interactions.rotateTo( d )
    await waitForAnimation()
    ret.scr[d] = v.interactions.screenshot()
  }
  */

  ret.duration = ( Date.now() - t0 ) / 1000
  ret.mem = { total: performance.memory.totalJSHeapSize, used: performance.memory.usedJSHeapSize }
  return ret
}

async function getScreenshot( objectUrl ) {
  let launchParams = { args: [ '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage' ] }
  // if ( process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true' ) {
  //   launchParams.executablePath = 'chromium'
  // }
  const browser = await puppeteer.launch( launchParams )
  const page = await browser.newPage()

  const wrapperPromise = new Promise( async ( resolve, reject ) => {
    try {
      await page.goto( 'http://127.0.0.1:3001/render/' )

      console.log( 'Page loaded' )

      // Handle page crash (oom?)
      page.on( 'error', ( err ) => {
        reject ( err )
      } )
    
      page.evaluate( pageFunction, objectUrl )
        .then( ret => { resolve( ret ) } )
        .catch( err => { reject( err ) } )

    } catch ( err ) {
      return reject( err )
    }

  } )

  let ret = null
  try {
    ret = await wrapperPromise
  } catch ( err ) {
    console.log( `Error generating preview for ${objectUrl}: ${err}` )
    ret = {
      error: err,
    }
  }
  
  // Don't await for cleanup
  browser.close()

  if ( ret.error ) {
    return null
  }

  console.log( `Generated preview for ${objectUrl} in ${ret.duration} sec with ${ret.mem.total / 1000000} MB of memory` )
  return ret.scr

  return `
  <html><body>
  <div>Duration in seconds: ${ret.duration}</div>
  <div>Memory in MB: ${ret.mem.total / 1000000}</div>
  <div>Used Memory in MB: ${ret.mem.used / 1000000}</div>
  <img height="200px" src="${ret.scr['-2']}" /><br />
  <img height="200px" src="${ret.scr['-1']}" /><br />
  <img height="200px" src="${ret.scr['0']}" /><br />
  <img height="200px" src="${ret.scr['1']}" /><br />
  <img height="200px" src="${ret.scr['2']}" /><br />
  </body></html>
  `

  const imageBuffer = new Buffer.from( b64Image.replace( /^data:image\/\w+;base64,/, '' ), 'base64' )

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

  let scr = await getScreenshot( objectUrl )

  if ( !scr ) {
    return res.status( 500 ).end()
  }

  // res.setHeader( 'content-type', 'image/png' )
  res.send( scr )
} )

module.exports = router
