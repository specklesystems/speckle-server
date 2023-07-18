import { NuxtApp } from '#app'
import { Optional } from '@speckle/shared'

export const useLogger = () => {
  let nuxtApp: Optional<NuxtApp>
  try {
    nuxtApp = useNuxtApp()
  } catch (e) {
    console.error('Nuxt app for logger not found! Skipping...')
    // suppress
  }

  return nuxtApp?.$logger
}
