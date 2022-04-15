'use strict'

const dns = require('dns')
const isIpPrivate = require('private-ip')

const fetch = require('node-fetch')
const debug = require('debug')('speckle')

async function isLocalNetworkUrl(url) {
  const parsedUrl = new URL(url)
  const hostname = parsedUrl.hostname
  const ip = await new Promise((resolve, reject) => {
    dns.lookup(hostname, (err, addr) => {
      if (err) {
        reject(err)
      } else {
        resolve(addr)
      }
    })
  })

  return isIpPrivate(ip)
}

async function makeNetworkRequest({ url, data, headersData }) {
  if (process.env.ALLOW_LOCAL_NETWORK !== 'true' && (await isLocalNetworkUrl(url))) {
    return {
      success: false,
      error:
        'Local network requests are not allowed. To allow, use ALLOW_LOCAL_NETWORK=true environment variable',
      duration: 0,
      responseCode: null,
      responseBody: null
    }
  }

  const httpSuccessCodes = [200]
  const headers = { 'Content-Type': 'application/json' }
  for (const k in headersData) headers[k] = headersData[k]

  debug('POST request to:', url)
  const t0 = Date.now()

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers,
      follow: 2, // follow max 2 redirects (fetch defaults to 20)
      timeout: 10 * 1000, // timeout after 10sec (defaults to no timeout)
      size: 500 * 1000 // 500kb max response size, to accommodate various error responses (defaults to no limit)
    }).then(async (res) => ({ status: res.status, body: await res.text() }))

    //console.log( 'Server response:', response )
    const error =
      httpSuccessCodes.indexOf(response.status) === -1
        ? `HTTP response code: ${response.status}`
        : ''
    const success = httpSuccessCodes.indexOf(response.status) !== -1
    return {
      success,
      error,
      duration: (Date.now() - t0) / 1000,
      responseCode: response.status,
      responseBody: response.body
    }
  } catch (e) {
    return {
      success: false,
      error: e.toString(),
      duration: (Date.now() - t0) / 1000,
      responseCode: null,
      responseBody: null
    }
  }
}

module.exports = { makeNetworkRequest, isLocalNetworkUrl }
