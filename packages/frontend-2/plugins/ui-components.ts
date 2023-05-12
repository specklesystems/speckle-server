import { FormButton } from '@speckle/ui-components'

/**
 * Registering some @speckle/ui-components components globally cause for the time being
 * we can't figure Nuxt-like auto-scanning there
 *
 * This isn't ideal cause all of these will always be bundled on all pages, so don't add too much here
 */

export default defineNuxtPlugin((app) => {
  app.vueApp.component('FormButton', FormButton)
})
