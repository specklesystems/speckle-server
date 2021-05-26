import ObjectLoader from '../../index.js'

// https://latest.speckle.dev/streams/92b620fb17/objects/7cd9d41b5b5f3c8908536aec2a05f1a1
let loader = new ObjectLoader({
  serverUrl:"https://latest.speckle.dev", 
  streamId:"92b620fb17", 
  objectId:"878c426bb213ddb4d580da74922a2b16"
})

let obj = await loader.getAndConstructObject((e)=>{
  console.log(e)
})

console.log('Done!')
console.log(obj)