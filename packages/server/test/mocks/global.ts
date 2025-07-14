import { adminOverrideEnabled } from '@/modules/shared/helpers/envHelper'

export const mockAdminOverride = () => {
  const baseValue = adminOverrideEnabled()

  const enable = (enabled: boolean) => {
    process.env.ADMIN_OVERRIDE_ENABLED = enabled.toString()
  }

  const disable = () => {
    process.env.ADMIN_OVERRIDE_ENABLED = baseValue.toString()
  }

  return { enable, disable }
}
