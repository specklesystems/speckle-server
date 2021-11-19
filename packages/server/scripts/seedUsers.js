const appRoot = require( 'app-root-path' )
const { createUser } = require( `${appRoot}/modules/core/services/users` )
const https = require( 'https' )
const axios = require( 'axios' )
const { fetch } = require( 'node-fetch' )

const main = async () => {
  let userInputs = ( await fetch( 'https://randomuser.me/api/?results=250' ) ).json().results.map( user => {
    return {
      name: `${user.name.first} ${user.name.last}`,
      email: user.email,
      password: `${user.login.password}${user.login.password}`
    }
  } )
  await Promise.all( userInputs.map( userInput => createUser( userInput ) ) )
}


main()
  .then( console.log( 'created' ) )
  .catch( console.log( 'failed' ) )