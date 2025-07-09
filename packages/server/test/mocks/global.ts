import { mockRequireModule } from '@/test/mockHelper'

/**
 * Global mocks that can be re-used. Early setup ensures that mocks work.
 */

// TODO: FOr mocking DB selector util available DBs
export const MultiRegionDbSelectorMock = mockRequireModule<
  typeof import('@/modules/multiregion/utils/dbSelector')
>(['@/modules/multiregion/utils/dbSelector'])

// TODO: FOr mocking multiregion blob storage init
export const MultiRegionBlobStorageSelectorMock = mockRequireModule<
  typeof import('@/modules/multiregion/utils/blobStorageSelector')
>(['@/modules/multiregion/utils/blobStorageSelector'])

// TODO: For mocking region config through GQL resolvers
export const MultiRegionConfigMock = mockRequireModule<
  typeof import('@/modules/multiregion/regionConfig')
>(['@/modules/multiregion/regionConfig'])

// TODO: FOr mocking stripe through GQL resolvers
export const StripeClientMock = mockRequireModule<
  typeof import('@/modules/gatekeeper/clients/stripe')
>(['@/modules/gatekeeper/clients/stripe'])

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
