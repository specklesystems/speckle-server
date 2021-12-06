'use strict'

const dns = require( 'dns' )
const isIpPrivate = require( 'private-ip' )

// Ignore invalid/self-signed https certificate errors for the entire process
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const fetch = require( 'node-fetch' )
var debug = require( 'debug' )( 'speckle' )

async function isLocalNetworkUrl( url ) {
  let parsedUrl = new URL( url )
  let hostname = parsedUrl.hostname
  let ip = await new Promise( ( resolve, reject ) => {
    dns.lookup( hostname, ( err, addr, fam ) => {
      if ( err ) {
        reject( err )
      } else {
        resolve( addr )
      }
    } )
  } )

  return isIpPrivate( ip )
}

async function makeNetworkRequest( { url, data, headersData } ) {
  if ( process.env.ALLOW_LOCAL_NETWORK !== 'true' && isLocalNetworkUrl( url ) ) {
    return {
      success: false,
      error: 'Local network requests are not allowed. To allow, use ALLOW_LOCAL_NETWORK=true environment variable',
      duration: 0,
      responseCode: null,
      responseBody: null
    }
  }

  let httpSuccessCodes = [ 200 ]
  let headers = { 'Content-Type': 'application/json' }
  for ( let k in headersData ) headers[ k ] = headersData[ k ]
  
  debug( 'POST request to:', url )
  let t0 = Date.now()

  try {
    let response = await fetch( url, {
      method: 'POST',
      body:    JSON.stringify( data ),
      headers: headers,
      follow: 2, // follow max 2 redirects (fetch defaults to 20)
      timeout: 10 * 1000, // timeout after 10sec (defauls to no timeout)
      size: 500 * 1000, // 500kb max response size, to accomodate various error responses (defaults to no limit)
    } ).then( async res => ( { status: res.status, body: await res.text() } ) )
 
    //console.log( 'Server response:', response )
    let error = httpSuccessCodes.indexOf( response.status ) === -1 ? `HTTP response code: ${response.status}` : ''
    let success = httpSuccessCodes.indexOf( response.status ) !== -1
    return {
      success: success,
      error: error,
      duration: ( Date.now() - t0 ) / 1000,
      responseCode: response.status,
      responseBody: response.body
    }
  } catch ( e ) {
    return {
      success: false,
      error: e.toString(),
      duration: ( Date.now() - t0 ) / 1000,
      responseCode: null,
      responseBody: null
    }
  }
}

module.exports = { makeNetworkRequest, isLocalNetworkUrl }

