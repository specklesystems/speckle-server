import { createRequire } from 'node:module'
import { has, isObjectLike } from 'lodash-es'
import { defineNuxtModule, addComponent } from '@nuxt/kit'
import * as SpeckleUiComponents from '@speckle/ui-components'

const req = createRequire(import.meta.url)

const isVueComponent = (val) => {
  if (!isObjectLike(val)) return false
  return has(val, '__name')
}

export default defineNuxtModule({
  meta: {
    name: 'speckle-ui-components'
  },
  async setup() {
    // const filePath = await import.meta.resolve('@speckle/ui-components')
    const filePath = req.resolve('@speckle/ui-components')

    // Add all @speckle/ui-components components
    for (const [key, val] of Object.entries(SpeckleUiComponents)) {
      if (!isVueComponent(val)) return
      addComponent({
        name: key,
        filePath,
        export: key
      })
    }
  }
})
