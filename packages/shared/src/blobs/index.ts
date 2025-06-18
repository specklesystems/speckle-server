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
  'skp'
]

export const BlobUploadStatus = <const>{
  Pending: 0,
  Completed: 1,
  Error: 2
}

export type BlobUploadStatus = (typeof BlobUploadStatus)[keyof typeof BlobUploadStatus]
