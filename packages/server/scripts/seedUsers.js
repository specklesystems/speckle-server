const appRoot = require( 'app-root-path' )
const { createUser } = require( `${appRoot}/modules/core/services/users` )
const axios = require( 'axios' ).default

const main = async () => {
  let userInputs = ( await axios.get( 'https://randomuser.me/api/?results=250' ) ).data.results.map( user => {
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