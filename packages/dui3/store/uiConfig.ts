import { UiConfig } from 'lib/bindings/definitions/IUiConfigBinding'

export const useUiConfigStore = defineStore('uiConfigStore', () => {
  const { $uiConfigBinding, $baseBinding } = useNuxtApp()

  const hasConfigBindings = ref(!!$uiConfigBinding)
  const uiConfig = ref<UiConfig>({ darkTheme: false, onboardingCompleted: false })
  // const uiConnectorConfig = ref<UiConfig>({ darkTheme: false })
  const hostAppName = computed(
    async () => await $baseBinding.getSourceApplicationName()
  )
  watch(
    uiConfig,
    async (newValue) => {
      if (!newValue || !$uiConfigBinding) return
      await $uiConfigBinding.updateConfig(newValue, await hostAppName.value)
    },
    { deep: true }
  )

  const isDarkTheme = computed(() => {
    return uiConfig.value?.darkTheme
  })

  const toggleTheme = () => {
    uiConfig.value.darkTheme = !uiConfig.value.darkTheme
  }

  const init = async () => {
    if (!$uiConfigBinding) return
    console.log(hostAppName.value)

    uiConfig.value = await $uiConfigBinding.getConfig(await hostAppName.value)
  }
  void init()

  return { hasConfigBindings, isDarkTheme, toggleTheme }
})
