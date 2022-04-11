import ObjectLoader from './objectloader.web.js'
window.ObjectLoader = ObjectLoader

// let loader = new ObjectLoader({serverUrl:"https://latest.speckle.dev", streamId:"16d73b756a", objectId:"99b20746460c4369f25e08e92c988a9d"})
// let loader = new ObjectLoader({serverUrl:"https://latest.speckle.dev", streamId:"16d73b756a", objectId:"b8f41c190591c196c42905b75616fdb1"})
// let loader = new ObjectLoader({serverUrl:"https://latest.speckle.dev", streamId:"16d73b756a", objectId:"99b20746460c4369f25e08e92c988a9d"})
// let loader = new ObjectLoader({serverUrl:"https://latest.speckle.dev", streamId:"92b620fb17", objectId:"5f466b7bce58fda5036489e486ce1694"})
// let loader = new ObjectLoader({serverUrl:"https://latest.speckle.dev", streamId:"92b620fb17", objectId:"5f466b7bce58fda5036489e486ce1694"})

// https://latest.speckle.dev/streams/92b620fb17/objects/7cd9d41b5b5f3c8908536aec2a05f1a1
// let loader = new ObjectLoader({
//   serverUrl:"https://latest.speckle.dev",
//   streamId:"92b620fb17",
//   objectId:"878c426bb213ddb4d580da74922a2b16"
// })

// https://latest.speckle.dev/streams/3ed8357f29/objects/0408ab9caaa2ebefb2dd7f1f671e7555
const loader = new ObjectLoader({
  serverUrl: 'https://latest.speckle.dev',
  streamId: '3ed8357f29',
  objectId: '0408ab9caaa2ebefb2dd7f1f671e7555'
})

window.loadData = async function loadData() {
  const obj = await loader.getAndConstructObject((e) => {
    console.log(e) // log progress!
  })

  console.log('Done!')
  console.log(obj)
}
