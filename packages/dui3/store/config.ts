import { Config } from 'lib/bindings/definitions/IConfigBinding'
import { useHostAppStore } from '~~/store/hostApp'

export const useConfigStore = defineStore('configStore', () => {
  const { $configBinding } = useNuxtApp()
  const hostAppStore = useHostAppStore()

  const hasConfigBindings = ref(!!$configBinding)

  const config = ref<Config>({
    darkTheme: false,
    onboardingCompleted: false,
    hostApp: hostAppStore.hostAppName as string
  })

  watch(
    config,
    async (newValue) => {
      if (!newValue || !$configBinding) return
      await $configBinding.updateConfig(newValue)
    },
    { deep: true }
  )

  const isDarkTheme = computed(() => {
    return config.value?.darkTheme
  })

  const toggleTheme = () => {
    config.value.darkTheme = !config.value.darkTheme
  }

  const init = async () => {
    if (!$configBinding) return
    config.value = await $configBinding.getConfig()
  }
  void init()

  return { hasConfigBindings, isDarkTheme, toggleTheme }
})
