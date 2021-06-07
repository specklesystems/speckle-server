const { Transform } = require( 'stream' )

// A stream that converts database objects stream to "{id}\t{data_json}\n" stream or a json stream of obj.data fields

class SpeckleObjectsStream extends Transform {
  constructor( simpleText ) {
    super( { writableObjectMode: true } )
    this.simpleText = simpleText

    if ( !this.simpleText ) this.push( '[' )
    this.isFirstObject = true
  }

  _transform( dbObj, encoding, callback ) {
    try {
      if ( this.simpleText ) {
        this.push( `${dbObj.data.id}\t${JSON.stringify( dbObj.data )}\n` )
      } else {
        // JSON output
        if ( !this.isFirstObject ) this.push( ',' )
        this.push( JSON.stringify( dbObj.data ) )
        this.isFirstObject = false
      }
      callback()
    } catch ( e ) {
      callback( e )
    }
  }

  _flush( callback ) {
    if ( !this.simpleText ) this.push( ']' )
    callback()
  }

}

exports.SpeckleObjectsStream = SpeckleObjectsStream
