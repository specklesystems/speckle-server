'use strict'
let debug = require( 'debug' )
const Busboy = require( 'busboy' )

exports.init = async ( app, options ) => {
  debug( 'speckle:modules' )( '💥\tInit core module' )

  app.post( '/streaming', ( req, res ) => {
    console.log( req.headers )
    let busboy = new Busboy( { headers: req.headers } )

    res.writeHead( 200, { 'Content-Type': 'text/html; charset=UTF-8' } )
    busboy.on( 'file', ( fieldname, file, filename, encoding, mimetype ) => {

      console.log( 'File [' + fieldname + ']: filename: ' + filename );

      file.on( 'data', function ( data ) {
        console.log( 'File [' + fieldname + '] got ' + data.length + ' bytes' );
      } );

      file.on( 'end', function ( ) {
        console.log( 'File [' + fieldname + '] Finished' );
        console.log( file )
        res.write( ':::' )
        res.write( fieldname )
      } );

    } )

    busboy.on( 'finish', function ( ) {
      console.log( 'Done parsing form!' );
      res.end()
      // res.writeHead( 303, { Connection: 'close', Location: '/' } );
      // res.end( );
    } );

    req.pipe( busboy )

  } )
}