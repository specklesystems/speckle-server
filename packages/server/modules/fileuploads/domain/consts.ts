import { getFileImportTimeLimitMinutes } from '@/modules/shared/helpers/envHelper'
import { TIME, TIME_MS } from '@speckle/shared'
export const DelayBetweenFileImportRetriesMinutes = 5
export const NumberOfFileImportRetries = 3
export const BackgroundJobType = {
  FileImport: 'fileImport'
} as const

export type BackgroundJobType =
  (typeof BackgroundJobType)[keyof typeof BackgroundJobType]

export const BackgroundJobPayloadVersion = {
  v1: 1
} as const

export type BackgroundJobPayloadVersion =
  (typeof BackgroundJobPayloadVersion)[keyof typeof BackgroundJobPayloadVersion]

export const maximumAllowedQueuingProcessingAndRetryTimeMs = () => 1 * TIME_MS.day
// NumberOfFileImportRetries *
// (getFileImportTimeLimitMinutes() + DelayBetweenFileImportRetriesMinutes + 1) *
// TIME_MS.minute // allowing an extra minute for some buffer

export const singleAttemptMaximumProcessingTimeSeconds = () =>
  getFileImportTimeLimitMinutes() * TIME.minute
