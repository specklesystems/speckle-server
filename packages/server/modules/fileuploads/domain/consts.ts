export const FileUploadDatabaseEvents = {
  Updated: 'file_import_update',
  Started: 'file_import_started'
} as const

export const DelayBetweenFileImportRetriesMinutes = 5
export const NumberOfFileImportRetries = 5
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
