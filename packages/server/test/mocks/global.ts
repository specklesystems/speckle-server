import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { createGlobalMock, mockRequireModule } from '@/test/mockHelper'
import type { FeatureFlags } from '@speckle/shared/dist/commonjs/environment'

/**
 * Global mocks that can be re-used. Early setup ensures that mocks work.
 */

export const EmailSendingServiceMock = createGlobalMock<
  typeof import('@/modules/emails/services/sending')
>('@/modules/emails/services/sending')

export const CommentsRepositoryMock = mockRequireModule<
  typeof import('@/modules/comments/repositories/comments')
>(['@/modules/comments/repositories/comments'])

export const MultiRegionDbSelectorMock = mockRequireModule<
  typeof import('@/modules/multiregion/utils/dbSelector')
>(['@/modules/multiregion/utils/dbSelector'])

export const MultiRegionBlobStorageSelectorMock = mockRequireModule<
  typeof import('@/modules/multiregion/utils/blobStorageSelector')
>(['@/modules/multiregion/utils/blobStorageSelector'])

export const MultiRegionConfigMock = mockRequireModule<
  typeof import('@/modules/multiregion/regionConfig')
>(['@/modules/multiregion/regionConfig'])

export const StripeClientMock = mockRequireModule<
  typeof import('@/modules/gatekeeper/clients/stripe')
>(['@/modules/gatekeeper/clients/stripe'])

export const EnvHelperMock = mockRequireModule<
  typeof import('@/modules/shared/helpers/envHelper')
>(
  [
    '@/modules/shared/helpers/envHelper',
    require.resolve('../../modules/shared/helpers/envHelper')
  ],
  ['@/modules/shared/index']
)

export const StreamsRepositoryMock = mockRequireModule<
  typeof import('@/modules/core/repositories/streams')
>(['@/modules/core/repositories/streams'])

export const mockGetFeatureFlags = () => {
  const enable = (override: Partial<FeatureFlags>) => {
    EnvHelperMock.mockFunction('getFeatureFlags', () => {
      return { ...getFeatureFlags(), ...override }
    })
  }

  const disable = () => {
    EnvHelperMock.resetMockedFunction('getFeatureFlags')
  }

  return { enable, disable }
}
