import {
  ConnectorConfig,
  GlobalConfig,
  UiConfig
} from 'lib/bindings/definitions/IConfigBinding'
import { useHostAppStore } from '~~/store/hostApp'

export const useConfigStore = defineStore('configStore', () => {
  const { $configBinding } = useNuxtApp()
  const hostAppStore = useHostAppStore()

  const hasConfigBindings = ref(!!$configBinding)

  const config = ref<UiConfig>()

  const globalConfig = ref<GlobalConfig>({
    onboardingSkipped: false,
    onboardings: {}
  })

  const connectorConfig = ref<ConnectorConfig>({
    hostApp: hostAppStore.hostAppName as string,
    darkTheme: false,
    onboardings: {}
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

  const onboardings = computed(() => {
    return {
      ...globalConfig.value.onboardings,
      ...connectorConfig.value.onboardings
    }
  })

  const onboardingSkipped = computed(() => globalConfig.value.onboardingSkipped)

  const onboardingCompleted = computed(() => {
    console.log(onboardings.value)

    return Object.values(onboardings.value).every((o) => o.completed)
  })

  const skipOnboarding = () => {
    globalConfig.value.onboardingSkipped = true
  }

  const completeOnboarding = (id: string) => {
    onboardings.value[id].completed = true
  }

  const isDarkTheme = computed(() => {
    return connectorConfig.value?.darkTheme
  })

  const toggleTheme = () => {
    connectorConfig.value.darkTheme = !connectorConfig.value.darkTheme
  }

  const isInitialized = ref(false)

  const init = async () => {
    if (!$configBinding) return
    const uiConfig = await $configBinding.getConfig()
    config.value = uiConfig
    globalConfig.value = uiConfig.global
    connectorConfig.value =
      uiConfig.connectors[hostAppStore.hostAppName?.toLowerCase() as string]
    isInitialized.value = true
  }
  init()

  return {
    isInitialized,
    config,
    hasConfigBindings,
    isDarkTheme,
    onboardings,
    onboardingCompleted,
    onboardingSkipped,
    toggleTheme,
    completeOnboarding,
    skipOnboarding
  }
})
