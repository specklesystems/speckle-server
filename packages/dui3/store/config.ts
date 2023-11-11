import {
  ConnectorConfig,
  GlobalConfig,
  UiConfig
} from 'lib/bindings/definitions/IConfigBinding'
import { useHostAppStore } from '~~/store/hostApp'

export const useConfigStore = defineStore('configStore', () => {
  const { $configBinding } = useNuxtApp()
  const hostAppStore = useHostAppStore()
  const router = useRouter()

  const hasConfigBindings = ref(!!$configBinding)

  const config = ref<UiConfig>()

  const globalConfig = ref<GlobalConfig>({
    onboardingCompleted: false
  })

  const connectorConfig = ref<ConnectorConfig>({
    hostApp: hostAppStore.hostAppName as string,
    darkTheme: false,
    onboarding: {
      skipped: false,
      onboardings: {}
    }
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
    router.push('/')
  }

  const skipOnboarding = () => {
    connectorConfig.value.onboarding.skipped = true
  }

  const completeConnectorOnboarding = (id: string) => {
    connectorConfig.value.onboarding.onboardings[id].completed = true
  }

  const isDarkTheme = computed(() => {
    return connectorConfig.value?.darkTheme
  })

  const toggleTheme = () => {
    connectorConfig.value.darkTheme = !connectorConfig.value.darkTheme
  }

  const allOnboardingCompleted = computed(() => {
    for (const key in connectorConfig.value.onboarding.onboardings) {
      if (!connectorConfig.value.onboarding.onboardings[key].completed) {
        return false
      }
    }
    return true
  })

  const onboardingSkipped = computed(() => connectorConfig.value.onboarding.skipped)

  const init = async () => {
    if (!$configBinding) return
    const uiConfig = await $configBinding.getConfig()
    config.value = uiConfig
    globalConfig.value = uiConfig.global
    connectorConfig.value =
      uiConfig.connectors[hostAppStore.hostAppName?.toLowerCase() as string]
  }
  void init()

  return {
    config,
    hasConfigBindings,
    isDarkTheme,
    onboardingCompleted,
    onboardingSkipped,
    allOnboardingCompleted,
    toggleTheme,
    completeOnboarding,
    completeConnectorOnboarding,
    skipOnboarding
  }
})
