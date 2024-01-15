import type { Optional } from '@speckle/shared'
import type { BlobPostResultItem, PostBlobResponse } from '~~/lib/core/api/blobStorage'

export enum FileUploadConvertedStatus {
  Queued = 0,
  Converting = 1,
  Completed = 2,
  Error = 3
}

export function importFile(
  params: {
    file: File
    projectId: string
    apiOrigin: string
    authToken: string
    modelName?: string
  },
  callbacks?: Partial<{
    onProgress: (percentage: number) => void
  }>
) {
  const { file, projectId, modelName, apiOrigin, authToken } = params
  const { onProgress } = callbacks || {}

  let resolveWithResponse: (res: BlobPostResultItem) => void
  let rejectResponse: (err: Error) => void
  const ret = new Promise<BlobPostResultItem>((resolve, reject) => {
    resolveWithResponse = resolve
    rejectResponse = reject
  })

  const finalModelName = encodeURIComponent(modelName || file.name)

  const data = new FormData()
  const formKey = 'file'
  data.append(formKey, file)

  const request = new XMLHttpRequest()
  request.open(
    'POST',
    new URL(`/api/file/autodetect/${projectId}/${finalModelName}`, apiOrigin).toString()
  )
  request.responseType = 'json'

  request.setRequestHeader('Authorization', `Bearer ${authToken}`)

  request.upload.addEventListener('progress', (e) => {
    const percentage = (e.loaded / e.total) * 100
    onProgress?.(percentage)
  })

  request.addEventListener('load', () => {
    if (!request.response) {
      return rejectResponse(
        new Error(
          `Upload failed${
            request.status ? ' with code ' + request.status : ''
          } - no response`
        )
      )
    }

    const uploadResults =
      (request.response as Optional<PostBlobResponse>)?.uploadResults || []
    const result = uploadResults.find((r) => r.formKey === formKey)

    if (!result) {
      return rejectResponse(
        new Error('Upload seems to have succeeded, but no metadata found')
      )
    }

    resolveWithResponse(result)
  })

  request.addEventListener('error', () => {
    const uploadResults =
      (request.response as Optional<PostBlobResponse>)?.uploadResults || []
    const result = uploadResults.find((r) => r.formKey === formKey)

    rejectResponse(new Error(result?.uploadError || 'Upload failed'))
  })

  request.send(data)

  return ret
}
