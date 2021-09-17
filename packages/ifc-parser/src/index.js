const fs = require( 'fs' )
const Parser = require( './parser' )
const ObjectSaver = require( './api.js' )


const myParser = new Parser( { objectSaver: new ObjectSaver({}) } )

// const data = fs.readFileSync( './ifcs/20160414office_model_CV2_fordesign.ifc' )
// const data = fs.readFileSync( './ifcs/231110AC11-Institute-Var-2-IFC.ifc' )
const data = fs.readFileSync( './ifcs/231110ADT-FZK-Haus-2005-2006.ifc' )
// const data = fs.readFileSync( './ifcs/small.ifc' )
// const data = fs.readFileSync( './ifcs/example.ifc' )

async function load() {
  const parsed = await myParser.parse( data )
  fs.writeFileSync( 'foo.txt', JSON.stringify( parsed ) )

  console.log( parsed )
}

load()
