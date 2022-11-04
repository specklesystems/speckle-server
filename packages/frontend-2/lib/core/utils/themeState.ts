import { Optional } from '@speckle/shared'
import { useEventBus } from '@vueuse/core'
import { CookieKeys, EventBusEvents } from '~~/lib/common/helpers/constants'

export enum AppTheme {
  Light = 'light',
  Dark = 'dark'
}

/**
 * Use this to read & write theme
 */
export function useTheme() {
  const themeCookie = useCookie<Optional<AppTheme>>(CookieKeys.Theme)

  const reactiveTheme = ref(themeCookie.value)
  const isDarkTheme = computed(() => reactiveTheme.value === AppTheme.Dark)
  const isLightTheme = computed(() => !isDarkTheme.value)

  // If new cookie value is set from another `useTheme()` invocation, all other `useTheme()` invocations
  // wont sync this change so we need a manual way to track the change across all invocations so that
  // the values returned by this composable truly are reactive and syncronized across the app
  const eventBus = useEventBus<AppTheme>(EventBusEvents.ThemeUpdated)
  eventBus.on((newTheme) => {
    reactiveTheme.value = newTheme
  })

  return {
    setTheme: (newTheme: AppTheme) => {
      // Update cookie
      themeCookie.value = newTheme

      // Update local theme ref
      reactiveTheme.value = newTheme

      // Emit event
      eventBus.emit(newTheme)
    },
    isDarkTheme,
    isLightTheme
  }
}
