import { createGlobalMock, mockRequireModule } from '@/test/mockHelper'

/**
 * Global mocks that can be re-used. Early setup ensures that mocks work.
 */

export const EmailSendingServiceMock = createGlobalMock<
  typeof import('@/modules/emails/services/sending')
>('@/modules/emails/services/sending')

export const CommentsRepositoryMock = mockRequireModule<
  typeof import('@/modules/comments/repositories/comments')
>(['@/modules/comments/repositories/comments'])

export const MultiRegionConfigServiceMock = mockRequireModule<
  typeof import('@/modules/multiregion/services/config')
>(['@/modules/multiregion/services/config'])

export const MultiRegionDbSelectorMock = mockRequireModule<
  typeof import('@/modules/multiregion/dbSelector')
>(['@/modules/multiregion/dbSelector'])
