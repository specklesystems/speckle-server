import { useActiveUser } from '~/lib/auth/composables/activeUser'
import { useGlobalToast } from '~/lib/common/composables/toast'

export const useIsAutomateModuleEnabled = () => {
  const {
    public: { ENABLE_AUTOMATE_MODULE }
  } = useRuntimeConfig()

  return ref(ENABLE_AUTOMATE_MODULE)
}

export { useGlobalToast, useActiveUser }
