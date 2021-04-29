
import { Viewer, Converter } from '@speckle/viewer'
import ObjectLoader from '@speckle/objectloader'

let v = new Viewer( { container: document.getElementById( 'renderer' ), showStats: false } )
// v.on( 'load-progress', args => console.log( args ) )

window.v = v

window.LoadData = async function LoadData( url ) {
  await v.loadObject( url, token )
}

window.onload = (event) => {
  let testUrl = window.location.hash.substr(1);
  if (testUrl) {
    LoadData(testUrl);
  };
};
