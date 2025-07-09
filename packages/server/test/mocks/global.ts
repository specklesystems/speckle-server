import { mockRequireModule } from '@/test/mockHelper'

/**
 * Global mocks that can be re-used. Early setup ensures that mocks work.
 */

// TODO: For mocking env settings, specifically admin override
export const EnvHelperMock = mockRequireModule<
  typeof import('@/modules/shared/helpers/envHelper')
>(
  [
    '@/modules/shared/helpers/envHelper'
    // require.resolve('../../modules/shared/helpers/envHelper')
  ],
  ['@/modules/shared/index']
)

export const mockAdminOverride = () => {
  const enable = (enabled: boolean) => {
    EnvHelperMock.mockFunction('adminOverrideEnabled', () => enabled)
  }

  const disable = () => {
    EnvHelperMock.resetMockedFunction('adminOverrideEnabled')
  }

  return { enable, disable }
}
