import crs from 'crypto-random-string'

const appId = 'spklwebapp'
const appSecret = 'spklwebapp'

export async function signIn( ) {
  // Stage 0: if we have an access code, exchange it for a token
  const accessCode = ( new URLSearchParams( window.location.search ) ).get( 'access_code' )
  if ( accessCode ) {
    let response = await getTokenFromAccessCode( accessCode )
    if ( response.hasOwnProperty( 'token' ) ) {
      localStorage.clear( )
      localStorage.setItem( 'AuthToken', response.token )
      localStorage.setItem( 'RefreshToken', response.refreshToken )
      await prefetchUserAndSetSuuid( )
      window.history.replaceState( {}, document.title, '/' )
      return true
    }
  }

  // Stage 1: check if there is an existing valid token by pinging the graphql api
  let token = localStorage.getItem( 'AuthToken' )
  if ( token ) {
    let data = await prefetchUserAndSetSuuid( )
    // if res.data.user is non null, means the ping was ok & token is valid
    if ( data.user )
      return true
  }

  // Stage 2: check if we have a valid refresh token by using it!
  let refreshToken = localStorage.getItem( 'RefreshToken' )

  if ( refreshToken ) {

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
      await prefetchUserAndSetSuuid( )
      return true
    }

  }

  // tried all avenues, means we need to init a full authorization flow.
  // this will essentially refresh the browser window, so no need to return.
  redirectToAuth( )
  return false
}

async function prefetchUserAndSetSuuid( ) {
  let token = localStorage.getItem( 'AuthToken' )
  if ( token ) {
    let testResponse = await fetch( '/graphql', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify( { query: `{ user { id suuid } }` } )
    } )

    let data = ( await testResponse.json( ) ).data
    if ( data.user ) {
      localStorage.setItem( 'suuid', data.user.suuid )
    }

    return data
  }
}

export async function getTokenFromAccessCode( accessCode ) {
  console.log( 'found local challenge: ' + localStorage.getItem( 'appChallenge' ) )
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
  // Reaching this stage means we're initialising a full new auth flow,
  // TIP: also means we need to refresh the app challenge as well.
  localStorage.setItem( 'appChallenge', crs( { length: 10 } ) )
  // Finally, redirect to the auth lock.
  window.location = `/auth?app_id=spklwebapp&challenge=${localStorage.getItem( 'appChallenge') }`
}
