/**
 * Since Node v<18 does not provide fetch, we need to pass it in the options object. Popular fetch implementations like cross-fetch or node-fetch should work
 */
import fetch from 'cross-fetch'
import ObjectLoader from '../../dist/objectloader.js'

const loader = new ObjectLoader({
  serverUrl: 'https://latest.speckle.dev',
  streamId: '3ed8357f29',
  objectId: '0408ab9caaa2ebefb2dd7f1f671e7555',
  options: { enableCaching: false, excludeProps: [], fetch }
})

const loadData = async function loadData() {
  const obj = await loader.getAndConstructObject((e) => {
    console.log(e) // log progress!
  })

  console.log('Done!')
  console.log(obj)
}

loadData()
