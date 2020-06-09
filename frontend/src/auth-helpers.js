import crs from 'crypto-random-string'

const appId = 'spklwebapp'
const appSecret = 'spklwebapp'

export async function signIn( ) {
  console.log( 'sign ing in' )
  // Stage 0: if we have an access code, exchange it for a token
  const accessCode = ( new URLSearchParams( window.location.search ) ).get( 'access_code' )
  if ( accessCode ) {
    console.log( 'access code flow' )
    let response = await getTokenFromAccessCode( accessCode )
    if ( response.hasOwnProperty( 'token' ) ) {
      localStorage.setItem( 'AuthToken', response.token )
      localStorage.setItem( 'RefreshToken', response.refreshToken )
      window.history.replaceState( {}, document.title, '/' )
      return true
    }
  }

  // Stage 1: check if there is an existing valid token by pinging the graphql api
  let token = localStorage.getItem( 'AuthToken' )
  if ( token ) {
    console.log( 'token flow' )
    let testResponse = await fetch( '/graphql', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify( { query: `{ user { id } }` } )
    } )

    let data = ( await testResponse.json( ) ).data
    // if res.data.user is non null, means the ping was ok & token is valid
    if ( data.user )
      return true
  }

  // Stage 2: check if we have a valid refresh token by using it!
  let refreshToken = localStorage.getItem( 'RefreshToken' )

  if ( refreshToken ) {
    console.log( 'refresh token flow flow' )
    console.log( 'refreshing...' )
    let refreshResponse = await fetch( '/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify( {
        refreshToken: refreshToken,
        appId: appId,
        appSecret: appSecret
      } )
    } )

    let data = await refreshResponse.json( )

    if ( data.hasOwnProperty( 'token' ) ) {
      localStorage.setItem( 'AuthToken', data.token )
      localStorage.setItem( 'RefreshToken', data.refreshToken )
      return true
    }
 
  }

  // tried all avenues, means we need to init a full authorization flow.
  // this will essentially refresh the browser window, so no need to return.
  redirectToAuth( )
  return false
}

export async function getTokenFromAccessCode( accessCode ) {
  let response = await fetch( '/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( {
      accessCode: accessCode,
      appId: appId,
      appSecret: appSecret,
      challenge: localStorage.getItem( 'appChallenge' )
    } )
  } )

  let data = await response.json( )
  return data
}

export function redirectToAuth( ) {
  console.log( 'redirecting to auth' )
  // Reaching this stage means we're initialising a full new auth flow, 
  // TIP: also means we need to refresh the app challenge as well.
  localStorage.setItem( 'appChallenge', crs( { length: 10 } ) )
  // Finally, redirect to the auth lock.
  window.location = `/auth?app_id=spklwebapp&challenge=${localStorage.getItem( 'appChallenge') }`
}