/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import Vue from 'vue'
import {
  UploadableFileItem,
  UploadFileItem
} from '@/main/lib/common/file-upload/fileUploadHelper'
import { getAuthToken } from '@/plugins/authHelpers'
import { clamp } from 'lodash'
import { BaseError } from '@/helpers/errorHelper'

export type BlobPostResultItem = {
  blobId?: string
  fileName?: string
  fileSize?: number
  formKey: string
  uploadStatus: number
  uploadError: string
}

type BlobUploadPrincipal = {
  streamId: string
}

export class BlobRetrievalError extends BaseError {
  static defaultMessage = 'An error occurred while trying to retrieve the blob'
}

/**
 * Initiate a browser file download of the specified blob
 * @param blobId
 * @param fileName Download filename
 * @param principal Owner of the blob
 */
export async function downloadBlobWithUrl(
  blobId: string,
  fileName: string,
  principal: BlobUploadPrincipal
) {
  const token = getAuthToken()
  const res = await fetch(`/api/stream/${principal.streamId}/blob/${blobId}`, {
    headers: token
      ? {
          Authorization: token
        }
      : undefined
  })

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
export async function getBlobUrl(blobId: string, principal: BlobUploadPrincipal) {
  const token = getAuthToken()
  const res = await fetch(`/api/stream/${principal.streamId}/blob/${blobId}`, {
    headers: token
      ? {
          Authorization: token
        }
      : undefined
  })

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
export function uploadFile(
  file: UploadFileItem,
  principal: BlobUploadPrincipal,
  callback?: (file: UploadFileItem) => void
): UploadFileItem {
  const cbWrapper = callback
    ? (files: Record<string, UploadFileItem>) => callback(Object.values(files)[0])
    : undefined
  const results = uploadFiles([file], principal, cbWrapper)
  return Object.values(results)[0]
}

/**
 * Upload files and return an UploadFileItem for each file (keyed by file ID)
 * @param files Files emitted from FileUploadZone
 * @param principal What entity should the file be attached to on the server
 * @returns A map of Vue observable UploadFileItems (they're reactive), keyed by
 * file.id
 */
export function uploadFiles(
  files: UploadableFileItem[],
  principal: BlobUploadPrincipal,
  callback?: (files: Record<string, UploadFileItem>) => void
): Record<string, UploadFileItem> {
  const authToken = getAuthToken()
  const formData = new FormData()
  const uploadFiles: Record<string, UploadFileItem> = {}

  for (const file of files) {
    // Actually upload the file only if it doesn't have an attached error
    // & if it isn't already added
    const hasError = file.error
    if (!hasError && !uploadFiles[file.id]) {
      formData.append(file.id, file.file)
    }

    uploadFiles[file.id] = Vue.observable({
      ...file,
      result: undefined,
      progress: 0
    })
  }

  // Nothing to upload, return
  if (![...formData.keys()].length) return uploadFiles

  // Init req
  const req = new XMLHttpRequest()
  req.open('POST', `/api/stream/${principal.streamId}/blob`)
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
    const uploadResults: BlobPostResultItem[] = (req.response?.uploadResults ||
      []) as BlobPostResultItem[]
    for (const uploadFile of Object.values(uploadFiles)) {
      if (uploadFile.error) continue

      uploadFile.progress = 100
      uploadFile.result = uploadResults.find((r) => r.formKey === uploadFile.id) || {
        uploadError: 'Unable to resolve upload results',
        uploadStatus: 2,
        formKey: uploadFile.id
      }
    }

    if (callback) callback(uploadFiles)
  })

  req.addEventListener('error', () => {
    const uploadResults: BlobPostResultItem[] = (req.response?.uploadResults ||
      []) as BlobPostResultItem[]
    for (const uploadFile of Object.values(uploadFiles)) {
      if (uploadFile.error) continue

      uploadFile.progress = 100
      uploadFile.result = uploadResults.find((r) => r.formKey === uploadFile.id) || {
        uploadError: 'Upload request failed unexpectedly',
        uploadStatus: 2,
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

export async function deleteBlob(blobId: string, principal: BlobUploadPrincipal) {
  const { streamId } = principal
  const authToken = getAuthToken()

  const res = await fetch(`/api/stream/${streamId}/blob/${blobId}`, {
    method: 'DELETE',
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    }
  })

  if (res.status !== 204) {
    throw new BlobDeleteFailedError()
  }
}
