import type { ConnectorConfig } from 'lib/bindings/definitions/IConfigBinding'
import { defineStore } from 'pinia'

export const useConfigStore = defineStore('configStore', () => {
  const { $configBinding } = useNuxtApp()

  const hasConfigBindings = ref(!!$configBinding)

  const userSelectedWorkspaceId = ref<string>()

  const config = ref<ConnectorConfig>({ darkTheme: true })

  const isDarkTheme = computed(() => {
    return config.value?.darkTheme
  })
  const isDevMode = ref(false)

  const toggleTheme = () => {
    config.value.darkTheme = !config.value.darkTheme
    $configBinding.updateConfig(config.value)
  }

  const setUserSelectedWorkspace = (workspaceId: string) => {
    userSelectedWorkspaceId.value = workspaceId
    try {
      $configBinding.setUserSelectedWorkspaceId(workspaceId)
    } catch (error) {
      console.warn(error) // for the users who do not have latest version with workspace config handling
    }
  }

  const isInitialized = ref(false)

  const init = async () => {
    if (!$configBinding) return
    config.value = await $configBinding.getConfig()
    const workspacesConfig = await $configBinding.getWorkspacesConfig()
    if (workspacesConfig && workspacesConfig.userSelectedWorkspaceId) {
      userSelectedWorkspaceId.value = workspacesConfig.userSelectedWorkspaceId
    }
  }
  init()

  const getIsDevMode = async () =>
    (isDevMode.value = await $configBinding.getIsDevMode())

  void getIsDevMode()

  return {
    isInitialized,
    config,
    hasConfigBindings,
    isDarkTheme,
    isDevMode,
    userSelectedWorkspaceId,
    toggleTheme,
    setUserSelectedWorkspace
  }
})
