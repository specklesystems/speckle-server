import { clamp } from 'lodash'
import { BaseError } from '~~/lib/core/errors/base'
import type {
  UploadableFileItem,
  UploadFileItem
} from '~~/lib/form/composables/fileUpload'
import type { Optional } from '@speckle/shared'
import type { Merge, SetRequired } from 'type-fest'
import { BlobUploadStatus } from '@speckle/ui-components'
import type { BlobPostResultItem } from '@speckle/ui-components'

export type BlobUploadPrincipal = {
  streamId: string
}

export type SuccessfullyUploadedFileItem = Merge<
  UploadFileItem,
  { result: SetRequired<BlobPostResultItem, 'blobId'> }
>

export class BlobRetrievalError extends BaseError {
  static defaultMessage = 'An error occurred while trying to retrieve the blob'
}

export function isSuccessfullyUploaded(
  upload: UploadFileItem
): upload is SuccessfullyUploadedFileItem {
  return !!upload.result?.blobId
}

/**
 * Initiate a browser file download of the specified blob
 * @param blobId
 * @param fileName Download filename
 * @param principal Owner of the blob
 */
export async function downloadBlobWithUrl(params: {
  blobId: string
  fileName: string
  principal: BlobUploadPrincipal
  token?: string
  apiOrigin: string
}) {
  const { blobId, fileName, principal, token, apiOrigin } = params
  const res = await fetch(
    new URL(`/api/stream/${principal.streamId}/blob/${blobId}`, apiOrigin),
    {
      headers: token
        ? {
            Authorization: token
          }
        : undefined
    }
  )

  if (res.status !== 200) {
    throw new BlobRetrievalError()
  }

  const blob = await res.blob()
  const fileUrl = window.URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.setAttribute('style', 'display: none;')
  a.setAttribute('href', fileUrl)
  a.setAttribute('download', fileName)
  document.body.appendChild(a)

  a.click()
  a.remove()
  window.URL.revokeObjectURL(fileUrl)
}

/**
 * Creates a string with a URL representing the blob. Use to display image previews, etc.
 * @param blobId
 * @param fileName Download filename
 * @param principal Owner of the blob
 */
export async function getBlobUrl(params: {
  blobId: string
  principal: BlobUploadPrincipal
  token?: string
  apiOrigin: string
}) {
  const { blobId, principal, token, apiOrigin } = params
  const res = await fetch(
    new URL(`/api/stream/${principal.streamId}/blob/${blobId}`, apiOrigin),
    {
      headers: token
        ? {
            Authorization: token
          }
        : undefined
    }
  )

  if (res.status !== 200) {
    throw new BlobRetrievalError()
  }

  const blob = await res.blob()
  const fileUrl = window.URL.createObjectURL(blob)
  return fileUrl
}

/**
 * Upload a single file and return an UploadFileItem
 * @param file File emitted from FileUploadZone
 * @param principal What entity should the file be attached to on the server
 * @returns A Vue Observable UploadFileItem, it's reactive so you can watch it etc. inside
 * your Vue components
 */
export function uploadFile(params: {
  file: UploadFileItem
  principal: BlobUploadPrincipal
  apiOrigin: string
  authToken?: string
  callback?: (file: UploadFileItem) => void
}): UploadFileItem {
  const { file, principal, authToken, callback, apiOrigin } = params
  const cbWrapper = callback
    ? (files: Record<string, UploadFileItem>) => callback(Object.values(files)[0])
    : undefined
  const results = uploadFiles({
    files: [file],
    principal,
    authToken,
    callback: cbWrapper,
    apiOrigin
  })
  return Object.values(results)[0]
}

export type PostBlobResponse = {
  uploadResults: BlobPostResultItem[]
}

/**
 * Upload files and return an UploadFileItem for each file (keyed by file ID)
 * @param files Files emitted from FileUploadZone
 * @param principal What entity should the file be attached to on the server
 * @returns A map of Vue observable UploadFileItems (they're reactive), keyed by
 * file.id
 */
export function uploadFiles(params: {
  files: UploadableFileItem[]
  principal: BlobUploadPrincipal
  apiOrigin: string
  authToken?: string
  callback?: (files: Record<string, UploadFileItem>) => void
}): Record<string, UploadFileItem> {
  const { files, principal, authToken, callback, apiOrigin } = params
  const formData = new FormData()
  const uploadFiles: Record<string, UploadFileItem> = {}

  for (const file of files) {
    // Actually upload the file only if it doesn't have an attached error
    // & if it isn't already added
    const hasError = file.error
    if (!hasError && !uploadFiles[file.id]) {
      formData.append(file.id, file.file)
    }

    // reactive so that whoever uses the result structures can track changes to
    // them w/o callbacks (e.g. progress increase)
    uploadFiles[file.id] = reactive({
      ...file,
      result: undefined,
      progress: 0
    })
  }

  // Nothing to upload, return
  if (![...formData.keys()].length) return uploadFiles

  // Init req
  const req = new XMLHttpRequest()
  req.open('POST', new URL(`/api/stream/${principal.streamId}/blob`, apiOrigin))
  req.responseType = 'json'

  if (authToken) {
    req.setRequestHeader('Authorization', `Bearer ${authToken}`)
  }

  req.upload.addEventListener('progress', (e) => {
    const newProgress = clamp(Math.floor((e.loaded / e.total) * 100), 0, 100)

    for (const resultItem of Object.values(uploadFiles)) {
      if (resultItem.error) continue

      resultItem.progress = newProgress
    }
  })

  req.addEventListener('load', () => {
    const uploadResults =
      (req.response as Optional<PostBlobResponse>)?.uploadResults || []
    for (const uploadFile of Object.values(uploadFiles)) {
      if (uploadFile.error) continue

      uploadFile.progress = 100
      uploadFile.result = uploadResults.find((r) => r.formKey === uploadFile.id) || {
        uploadError: 'Unable to resolve upload results',
        uploadStatus: BlobUploadStatus.Failure,
        formKey: uploadFile.id
      }
    }

    if (callback) callback(uploadFiles)
  })

  req.addEventListener('error', () => {
    const uploadResults =
      (req.response as Optional<PostBlobResponse>)?.uploadResults || []
    for (const uploadFile of Object.values(uploadFiles)) {
      if (uploadFile.error) continue

      uploadFile.progress = 100
      uploadFile.result = uploadResults.find((r) => r.formKey === uploadFile.id) || {
        uploadError: 'Upload request failed unexpectedly',
        uploadStatus: BlobUploadStatus.Failure,
        formKey: uploadFile.id
      }
    }

    if (callback) callback(uploadFiles)
  })

  req.send(formData)

  return uploadFiles
}

export class BlobDeleteFailedError extends BaseError {
  static defaultMessage = 'Unable to delete the file'
}

export async function deleteBlob(params: {
  blobId: string
  principal: BlobUploadPrincipal
  apiOrigin: string
  authToken?: string
}) {
  const { blobId, principal, authToken, apiOrigin } = params
  const { streamId } = principal

  const res = await fetch(
    new URL(`/api/stream/${streamId}/blob/${blobId}`, apiOrigin),
    {
      method: 'DELETE',
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      }
    }
  )

  if (res.status !== 204) {
    throw new BlobDeleteFailedError()
  }
}

export { BlobUploadStatus }
export type { BlobPostResultItem }
