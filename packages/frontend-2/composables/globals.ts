import { useActiveUser } from '~/lib/auth/composables/activeUser'
import { useGlobalToast } from '~/lib/common/composables/toast'

export const useIsAutomateModuleEnabled = () => {
  const {
    public: { FF_AUTOMATE_MODULE_ENABLED }
  } = useRuntimeConfig()

  return ref(FF_AUTOMATE_MODULE_ENABLED)
}

export const useIsGendoModuleEnabled = () => {
  const {
    public: { FF_GENDOAI_MODULE_ENABLED }
  } = useRuntimeConfig()
  return ref(FF_GENDOAI_MODULE_ENABLED)
}

export { useGlobalToast, useActiveUser }
