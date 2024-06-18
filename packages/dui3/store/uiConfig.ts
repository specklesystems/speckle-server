import { defineStore } from 'pinia'
import type { Config } from 'lib/bindings/definitions/IConfigBinding'

export const useDocumentInfoStore = defineStore('documentInfoStore', () => {
  const { $configBinding } = useNuxtApp()

  const hasConfigBindings = ref(!!$configBinding)
  const uiConfig = ref<Config>({ darkTheme: false })

  watch(
    uiConfig,
    async (newValue) => {
      if (!newValue || !$configBinding) return
      await $configBinding.updateConfig(newValue)
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
    if (!$configBinding) return
    uiConfig.value = await $configBinding.getConfig()
  }
  void init()

  return { hasConfigBindings, isDarkTheme, toggleTheme }
})
