import { useSettingsMenuState } from '~/lib/settings/composables/menu'

export default defineNuxtRouteMiddleware((to, from) => {
  const settingsMenuState = useSettingsMenuState()

  if (to.path.startsWith('/settings') && !from.path.startsWith('/settings')) {
    settingsMenuState.value.previousRoute = from.fullPath
  }
})
