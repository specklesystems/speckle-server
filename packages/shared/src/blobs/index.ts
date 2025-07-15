export const acceptedFileExtensions = [
  'pdf',
  'zip',
  '7z',
  'pptx',
  'ifc',
  'dwg',
  'dxf',
  '3dm',
  'ghx',
  'gh',
  'rvt',
  'pla',
  'pln',
  'obj',
  'blend',
  '3ds',
  'max',
  'mtl',
  'stl',
  'md',
  'txt',
  'csv',
  'xlsx',
  'xls',
  'doc',
  'docx',
  'svg',
  'eps',
  'gwb',
  'skp',
  'pbix'
]

export const BlobUploadStatus = <const>{
  Pending: 0,
  Completed: 1,
  Error: 2
}

export type BlobUploadStatus = (typeof BlobUploadStatus)[keyof typeof BlobUploadStatus]
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
