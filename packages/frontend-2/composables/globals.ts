import { useActiveUser } from '~/lib/auth/composables/activeUser'
import { useGlobalToast } from '~/lib/common/composables/toast'

export const useIsAutomateModuleEnabled = () => {
  const {
    public: { enableAutomateModule }
  } = useRuntimeConfig()

  return ref(enableAutomateModule)
}

export { useGlobalToast, useActiveUser }
