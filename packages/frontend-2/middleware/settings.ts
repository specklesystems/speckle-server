import { useSettingsMenuState } from '~/lib/settings/composables/menu'
import { settingsRoutes, homeRoute } from '~/lib/common/helpers/route'
import { Roles } from '@speckle/shared'

export default defineNuxtRouteMiddleware((to, from) => {
  const settingsMenuState = useSettingsMenuState()
  const { activeUser } = useActiveUser()

  const serverRoutes = [...Object.values(settingsRoutes.server)].map(
    (section) => section.route
  )

  if (serverRoutes.includes(to.path) && activeUser.value?.role !== Roles.Server.Admin) {
    return navigateTo(homeRoute)
  }

  if (to.path.startsWith('/settings') && !from.path.startsWith('/settings')) {
    settingsMenuState.value.previousRoute = from.path
  }
})
