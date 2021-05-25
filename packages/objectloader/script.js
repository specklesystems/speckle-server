import ObjectLoader from './index.js'
window.ObjectLoader = ObjectLoader

// let loader = new ObjectLoader({serverUrl:"https://latest.speckle.dev", streamId:"16d73b756a", objectId:"b8f41c190591c196c42905b75616fdb1"})
// let loader = new ObjectLoader({serverUrl:"https://latest.speckle.dev", streamId:"16d73b756a", objectId:"99b20746460c4369f25e08e92c988a9d"})
let loader = new ObjectLoader({serverUrl:"https://latest.speckle.dev", streamId:"92b620fb17", objectId:"5f466b7bce58fda5036489e486ce1694"})


window.loadData = async function loadData() {
  // let test = await loader.downloadObjectsInBuffer((e) =>{
  //   console.log(e)
  // })

  let test = await loader.getAndConstructObject((e) =>{
    console.log(e)
  })

  console.log( test )
}