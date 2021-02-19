
import Viewer from './modules/Viewer'
import ObjectLoader from './modules/ObjectLoader'
import Converter from './modules/Converter'

let v = new Viewer( { container: document.getElementById( 'renderer' ), showStats: true } )
v.on( 'load-progress', args => console.log( args ) )

window.v = v

const token = 'e844747dc6f6b0b5c7d5fbd82d66de6e9529531d75'

window.LoadData = async function LoadData( url ) {
  url = url || document.getElementById( 'objectUrlInput' ).value
  await v.loadObject( url, token )
}

window.LoadDataOld = async function LoadData( id ) {

  // v.sceneManager.removeAllObjects()

  id = id || document.getElementById( 'objectIdInput' ).value
  let loader = new ObjectLoader( {
    serverUrl: 'https://staging.speckle.dev',
    streamId: '5486aa9fc7',
    token,
    objectId: id
  } )

  let converter = new Converter( loader )
  let first = true
  // Note: it's important the loop continues to load.
  for await ( let obj of loader.getObjectIterator() ) {
    if ( first ) {
      ( async() => {
        await converter.traverseAndConvert( obj, ( o ) => v.sceneManager.addObject( o ) )
      } )()
      first = false
    }
  }
}
