import { Optional } from '@speckle/shared'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { CookieKeys } from '~~/lib/common/helpers/constants'

export enum AppTheme {
  Light = 'light',
  Dark = 'dark'
}

/**
 * Use this to read & write theme
 */
export function useTheme() {
  const themeCookie = useSynchronizedCookie<Optional<AppTheme>>(CookieKeys.Theme)
  const isDarkTheme = computed(() => themeCookie.value === AppTheme.Dark)
  const isLightTheme = computed(() => !isDarkTheme.value)

  return {
    setTheme: (newTheme: AppTheme) => {
      themeCookie.value = newTheme
    },
    isDarkTheme,
    isLightTheme
  }
}
