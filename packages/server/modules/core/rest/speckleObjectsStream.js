const { Transform } = require( 'stream' )

// A stream that converts database objects stream to "{id}\t{data_json}\n" stream or a json stream of obj.data fields

class SpeckleObjectsStream extends Transform {
  constructor( simpleText ) {
    super( { writableObjectMode: true } )
    this.simpleText = simpleText
  }

  _transform( dbObj, encoding, callback ) {
    if ( this.simpleText ) {
      this.push( `${dbObj.data.id}\t${JSON.stringify( dbObj.data )}\n` )
      
    } else {

    }
    callback()
  }

  _flush( callback ) {
    callback()
  }

}

exports.SpeckleObjectsStream = SpeckleObjectsStream
