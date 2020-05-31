'use strict'
let debug = require( 'debug' )( 'speckle:modules' )
const root = require( 'app-root-path' )
const mw = require( `${root}/modules/shared` )

exports.init = ( app, options ) => {

  debug( '☢️\tInit test module' )

  let strategies = [ {
    strategyName: 'Github',
    route: '/auth/github',
    icon: 'github'
  }, {
    strategyName: 'Google',
    route: '/auth/google',
    icon: 'google'
  } ]

  
  // app.get('/auth/register', (req, res) => {
  //   res.send('Register')
  // })

  // app.post('/auth/register', (req, res) => {

  // })

  // app.get('/auth/login', (req, res) => {
  //   res.send('Login')
  // })

  // app.post('/auth/signin', (req, res) => {

  // })

}