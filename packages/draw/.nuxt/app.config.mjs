
import { defuFn } from 'defu'

const inlineConfig = {
  "nuxt": {}
}

/** client **/
import { _replaceAppConfig } from '#app/config'

// Vite - webpack is handled directly in #app/config
if (import.meta.dev && !import.meta.nitro && import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    _replaceAppConfig(newModule.default)
  })
}
/** client-end **/



export default /*@__PURE__*/ defuFn(inlineConfig)
