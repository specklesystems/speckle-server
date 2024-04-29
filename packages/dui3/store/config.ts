import { ConnectorConfig } from 'lib/bindings/definitions/IConfigBinding'

export const useConfigStore = defineStore('configStore', () => {
  const { $configBinding } = useNuxtApp()

  const hasConfigBindings = ref(!!$configBinding)

  const config = ref<ConnectorConfig>({ darkTheme: true })

  const isDarkTheme = computed(() => {
    return config.value?.darkTheme
  })

  const toggleTheme = () => {
    config.value.darkTheme = !config.value.darkTheme
    $configBinding.updateConfig(config.value)
  }

  const isInitialized = ref(false)

  const init = async () => {
    if (!$configBinding) return
    config.value = await $configBinding.getConfig()
  }
  init()

  return {
    isInitialized,
    config,
    hasConfigBindings,
    isDarkTheme,
    toggleTheme
  }
})
