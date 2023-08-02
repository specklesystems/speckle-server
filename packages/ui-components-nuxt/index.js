import { has, isObjectLike } from 'lodash-es'
import { defineNuxtModule, addComponent } from '@nuxt/kit'
import * as SpeckleUiComponents from '@speckle/ui-components'

const isVueComponent = (val) => {
  if (!isObjectLike(val)) return false
  return has(val, '__name')
}

export default defineNuxtModule({
  meta: {
    name: 'speckle-ui-components'
  },
  async setup() {
    // Add all @speckle/ui-components components
    for (const [key, val] of Object.entries(SpeckleUiComponents)) {
      const isVue = isVueComponent(val)
      if (!isVue) {
        continue
      }

      addComponent({
        name: key,
        filePath: '@speckle/ui-components',
        export: key
      })
    }
  }
})
