import { createGlobalMock } from '@/test/mockHelper'

/**
 * Global mocks that can be re-used. Remember to .enable() before use and .disable()
 * after use to ensure that other tests work with the real module.
 */

export const EmailSendingServiceMock = createGlobalMock<
  typeof import('@/modules/emails/services/sending')
>('@/modules/emails/services/sending')
