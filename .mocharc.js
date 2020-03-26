'use strict'
const fs = require( 'fs' )
const path = require( 'path' )

function walk( dir ) {
  let results = [ ]
  let list = fs.readdirSync( dir )
  list.forEach( function ( file ) {
    let fullFile = path.join( dir, file )
    let stat = fs.statSync( fullFile )
    if ( stat && stat.isDirectory( ) ) {
      if ( file === 'tests' )
        results.push( fullFile )
      else
        results = results.concat( walk( fullFile ) )
    }
  } )
  return results
}

let testDirs = walk( './modules' )


console.log( '\n' )
console.log( `📝 Found ${testDirs.length} test dirs:` )
console.log( testDirs )
console.log( '\n' )


module.exports = {
  spec: testDirs
}