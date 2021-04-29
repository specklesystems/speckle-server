'use strict'

var express = require( 'express' )
var router = express.Router()

router.get( '/', function( req, res, next ) {
  res.send( 'Speckle Object Preview Service' )
} )

module.exports = router
