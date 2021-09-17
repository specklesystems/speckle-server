const crypto = require( 'crypto' )

module.exports = class ObjectSaver {

	constructor( { serverUrl = 'http://localhost:3000' } ) {
		this.serverUrl = serverUrl 
		this.isSending = false
		this.buffer = []
	}

	async saveObject( obj ) { 
		if( !obj ) throw new Error( 'Null object' )
		
		if( !obj.id )	{
			obj.id = crypto.createHash( 'md5' ).update( JSON.stringify( obj ) ).digest( 'hex' )
		}
		
		// console.log( `TODO: save mesh ${obj.id}`)
		// TODO

		return obj.id
	}	

}