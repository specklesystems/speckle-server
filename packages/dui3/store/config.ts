import { ConnectorConfig, GlobalConfig } from 'lib/bindings/definitions/IConfigBinding'
import { useHostAppStore } from '~~/store/hostApp'

export const useConfigStore = defineStore('configStore', () => {
  const { $configBinding } = useNuxtApp()
  const hostAppStore = useHostAppStore()

  const hasConfigBindings = ref(!!$configBinding)

  const globalConfig = ref<GlobalConfig>({
    onboardingCompleted: false
  })

  const connectorConfig = ref<ConnectorConfig>({
    hostApp: hostAppStore.hostAppName as string,
    darkTheme: false
  })

  watch(
    connectorConfig,
    async (newValue) => {
      if (!newValue || !$configBinding) return
      await $configBinding.updateConnectorConfig(newValue)
    },
    { deep: true }
  )
  watch(
    globalConfig,
    async (newValue) => {
      if (!newValue || !$configBinding) return
      await $configBinding.updateGlobalConfig(newValue)
    },
    { deep: true }
  )

  const onboardingCompleted = computed(() => globalConfig.value.onboardingCompleted)

  const completeOnboarding = () => {
    globalConfig.value = { ...globalConfig.value, onboardingCompleted: true }
  }
  const isDarkTheme = computed(() => {
    return connectorConfig.value?.darkTheme
  })

  const toggleTheme = () => {
    connectorConfig.value.darkTheme = !connectorConfig.value.darkTheme
  }

  const init = async () => {
    if (!$configBinding) return
    const uiConfig = await $configBinding.getConfig()
    globalConfig.value = uiConfig.global
    connectorConfig.value =
      uiConfig.connectors[hostAppStore.hostAppName?.toLowerCase() as string]
  }
  void init()

  return {
    hasConfigBindings,
    isDarkTheme,
    toggleTheme,
    onboardingCompleted,
    completeOnboarding
  }
})
