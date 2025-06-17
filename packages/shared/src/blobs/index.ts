export const FileUploadConvertedStatus = <const>{
  Queued: 0,
  Converting: 1,
  Completed: 2,
  Error: 3
}

export type FileUploadConvertedStatus =
  (typeof FileUploadConvertedStatus)[keyof typeof FileUploadConvertedStatus]

export const fileUploadConvertedStatusLabels: Record<
  FileUploadConvertedStatus,
  string
> = {
  [FileUploadConvertedStatus.Queued]: 'Queued',
  [FileUploadConvertedStatus.Converting]: 'Converting',
  [FileUploadConvertedStatus.Completed]: 'Completed',
  [FileUploadConvertedStatus.Error]: 'Error'
}
