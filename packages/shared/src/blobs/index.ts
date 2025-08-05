// This is a full list of all the file extensions supported by Rhino
// For some of them, the utility to connect them with Speckle is unfounded

export const rhinoImporterSupportedFileExtensions = new Set([
  '3dm',
  '3dmbak',
  'rws',
  '3mf',
  '3ds',
  'amf',
  'ai',
  'dwg',
  'dxf',
  'x',
  'e57',
  'dst',
  'exp',
  'dst',
  'exp',
  'off',
  'gf',
  'gft',
  'gltf',
  'glb',
  'gts',
  'igs',
  'iges',
  'lwo',
  'dgn',
  'fbx',
  'scn',
  'obj',
  'pdf',
  'ply',
  'asc',
  'csv',
  'xyz',
  'pts',
  'cgo_ascii',
  'cgo_asci',
  'txt',
  'raw',
  'm',
  'pts',
  'svg',
  'skp',
  'slc',
  'sldprt',
  'sldasm',
  'stp',
  'step',
  'stl',
  'vda',
  'wrl',
  'vrml',
  'iv',
  'gdf'
])

export const acceptedFileExtensions = new Set([
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
  'pbix',
  ...rhinoImporterSupportedFileExtensions
])

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
