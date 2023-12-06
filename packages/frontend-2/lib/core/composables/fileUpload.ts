import type { MaybeRef } from '@vueuse/core'
import type { Optional } from '@speckle/shared'
import { useAuthCookie } from '~~/lib/auth/composables/auth'
import {
  deleteBlob,
  downloadBlobWithUrl,
  getBlobUrl,
  isSuccessfullyUploaded,
  uploadFiles
} from '~~/lib/core/api/blobStorage'
import type { BlobUploadPrincipal } from '~~/lib/core/api/blobStorage'
import type {
  UploadableFileItem,
  UploadFileItem
} from '~~/lib/form/composables/fileUpload'
import { differenceBy, isUndefined } from 'lodash-es'

export function useFileUpload() {
  const token = useAuthCookie()
  const apiOrigin = useApiOrigin()

  return {
    deleteFile: (blobId: string, principal: BlobUploadPrincipal) =>
      deleteBlob({ blobId, principal, authToken: token.value || undefined, apiOrigin }),
    uploadFiles: (
      files: UploadableFileItem[],
      principal: BlobUploadPrincipal,
      callback?: (files: Record<string, UploadFileItem>) => void
    ) =>
      uploadFiles({
        files,
        principal,
        authToken: token.value || undefined,
        callback,
        apiOrigin
      })
  }
}

export function useFileDownload() {
  const token = useAuthCookie()
  const apiOrigin = useApiOrigin()

  return {
    download: (params: { blobId: string; fileName: string; projectId: string }) =>
      downloadBlobWithUrl({
        blobId: params.blobId,
        fileName: params.fileName,
        principal: { streamId: params.projectId },
        token: token.value || undefined,
        apiOrigin
      }),
    getBlobUrl: (params: { blobId: string; projectId: string }) =>
      getBlobUrl({
        blobId: params.blobId,
        principal: { streamId: params.projectId },
        token: token.value || undefined,
        apiOrigin
      })
  }
}

type FilesSelectedEvent = { files: UploadableFileItem[] }
type FileUploadDeleteEvent = { id: string }

/**
 * Wrapper over useFileUpload that additionally holds a state of currently uploaded blobs, allows
 * deleting them by ID, ensures proper unprocessed blob deletion and hooks into the APIs of FileUploadZone
 * and FileUploadProgressRow nicely
 */
export function useAttachments(params: {
  countLimit?: MaybeRef<Optional<number>>
  projectId: MaybeRef<string>
}) {
  const { projectId } = params
  const { uploadFiles, deleteFile } = useFileUpload()
  const logger = useLogger()

  const currentFiles = ref([] as UploadFileItem[])
  const blobIds = computed(() =>
    currentFiles.value.filter(isSuccessfullyUploaded).map((f) => f.result.blobId)
  )

  const deleteBlobInBg = (blobId: string) => {
    deleteFile(blobId, { streamId: unref(projectId) }).catch(logger.error)
  }

  const deleteUpload = (fileId: string) => {
    const fileIdx = currentFiles.value.findIndex((f) => f.id === fileId)
    if (fileIdx === -1) return

    // Remove from array
    const [removedFile] = currentFiles.value.splice(fileIdx, 1) || []

    // Delete from blob storage
    if (removedFile.result?.blobId) {
      deleteBlobInBg(removedFile.result.blobId)
    }
  }

  onBeforeUnmount(() => {
    // Delete attachments that weren't posted
    for (const currentFile of currentFiles.value.slice()) {
      if (currentFile.inUse) continue
      deleteUpload(currentFile.id)
    }
  })

  watch(currentFiles, (newFiles, oldFiles) => {
    const deletableFiles = differenceBy(oldFiles || [], newFiles, (f) => f.id)
    for (const deletableFile of deletableFiles) {
      if (deletableFile.inUse) continue
      deleteUpload(deletableFile.id)
    }
  })

  return {
    onFilesSelected: (e: FilesSelectedEvent) => {
      const countLimit = unref(params.countLimit)
      const remainingCount = !isUndefined(countLimit)
        ? Math.max(0, countLimit - currentFiles.value.length)
        : undefined

      if (!isUndefined(remainingCount) && !remainingCount) return

      const incomingFiles = e.files
      const newFiles = differenceBy(incomingFiles, currentFiles.value, (f) => f.id)
      if (!newFiles.length) return

      const limitedFiles = newFiles.slice(0, remainingCount)
      const newUploads = Object.values(
        uploadFiles(limitedFiles, { streamId: unref(projectId) }, (uploadedFiles) => {
          // Delete files that were uploaded, but already removed from attachments
          for (const [id, file] of Object.entries(uploadedFiles)) {
            if (
              file.result?.blobId &&
              currentFiles.value.findIndex((f) => f.id === id) === -1 &&
              !file.inUse
            ) {
              deleteBlobInBg(file.result?.blobId)
            }
          }
        })
      )

      currentFiles.value = [...currentFiles.value, ...newUploads]
    },

    onUploadDelete: (e: FileUploadDeleteEvent) => {
      const { id } = e
      deleteUpload(id)
    },

    blobIds,

    uploads: currentFiles
  }
}
