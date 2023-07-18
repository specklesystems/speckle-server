import { NuxtApp } from '#app'
import { Optional } from '@speckle/shared'
import { buildFakePinoLogger } from '~~/lib/core/helpers/observability'

export const useLogger = () => {
  let nuxtApp: Optional<NuxtApp>
  try {
    nuxtApp = useNuxtApp()
  } catch (e) {
    console.error('Nuxt app for logger not found! Falling back to fake logger...')
    return buildFakePinoLogger()
  }

  return nuxtApp?.$logger
}
