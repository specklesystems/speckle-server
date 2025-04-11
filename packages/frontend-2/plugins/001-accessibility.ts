import { vKeyboardClickable } from '@speckle/ui-components'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('keyboard-clickable', vKeyboardClickable)
})
