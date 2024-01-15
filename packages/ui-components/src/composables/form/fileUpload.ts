import type { MaybeRef } from '@vueuse/core'
import type { MaybeNullOrUndefined, Nullable, Optional } from '@speckle/shared'
import {
  generateFileId,
  isFileTypeSpecifier,
  prettyFileSize,
  validateFileType
} from '~~/src/helpers/form/file'
import type { FileTypeSpecifier } from '~~/src/helpers/form/file'
import { computed, unref } from 'vue'
import type { CSSProperties } from 'vue'
import { BaseError } from '~~/src/lib'

/**
 * A file, as emitted out from FileUploadZone
 */
export interface UploadableFileItem {
  file: File
  error: Nullable<Error>
  /**
   * You can use this ID to check for File equality
   */
  id: string
}

export enum BlobUploadStatus {
  Success = 1,
  Failure = 2
}

export type BlobPostResultItem = {
  blobId?: string
  fileName?: string
  fileSize?: number
  formKey: string
  /**
   * Success = 1, Failure = 2
   */
  uploadStatus: number
  uploadError: string
}

export interface UploadFileItem extends UploadableFileItem {
  /**
   * Progress between 0 and 100
   */
  progress: number

  /**
   * When upload has finished this contains a BlobPostResultItem
   */
  result: Optional<BlobPostResultItem>

  /**
   * When a blob gets assigned to a resource, it should count as in use, and this will
   * prevent it from being deleted as junk
   */
  inUse?: boolean
}

function buildFileTypeSpecifiers(
  accept: Optional<string>
): Optional<FileTypeSpecifier[]> {
  if (!accept) return undefined
  const specifiers = accept
    .split(',')
    .map((s) => (isFileTypeSpecifier(s) ? s : null))
    .filter((s): s is FileTypeSpecifier => s !== null)

  return specifiers.length ? specifiers : undefined
}

export function usePrepareUploadableFiles(params: {
  disabled?: MaybeRef<Optional<boolean>>
  accept?: MaybeRef<Optional<string>>
  multiple?: MaybeRef<Optional<boolean>>
  countLimit?: MaybeRef<Optional<number>>
  sizeLimit: MaybeRef<number>
}) {
  const { disabled, accept, multiple, sizeLimit, countLimit } = params

  const fileTypeSpecifiers = computed(() => buildFileTypeSpecifiers(unref(accept)))

  const handleFiles = (files: File[]): UploadableFileItem[] => {
    const results: UploadableFileItem[] = []
    const allowedTypes = fileTypeSpecifiers.value

    for (const file of files) {
      const id = generateFileId(file)
      const finalCountLimit = !unref(multiple) ? 1 : unref(countLimit)

      // skip file, if it's selected twice somehow
      if (results.find((r) => r.id === id)) continue

      // Only allow a single file if !multiple
      if (finalCountLimit && results.length >= finalCountLimit) {
        break
      }

      if (allowedTypes) {
        const validationResult = validateFileType(file, allowedTypes)
        if (validationResult instanceof Error) {
          results.push({
            file,
            id,
            error: validationResult
          })
          continue
        }
      }

      if (file.size > unref(sizeLimit)) {
        results.push({
          file,
          id,
          error: new FileTooLargeError(
            `The selected file's size (${prettyFileSize(
              file.size
            )}) is too big (over ${prettyFileSize(unref(sizeLimit))})`
          )
        })
        continue
      }

      results.push({ file, id, error: null })
    }

    return results
  }

  return {
    /**
     * Validate incoming files and build UploadableFileItem structs out of them
     */
    buildUploadableFiles: (files: File[]) => {
      if (unref(disabled || false)) return
      return handleFiles(files)
    }
  }
}

class FileTooLargeError extends BaseError {
  static defaultMessage = "The selected file's size is too large"
}

export function useFileUploadProgressCore(params: {
  item: MaybeRef<MaybeNullOrUndefined<UploadFileItem>>
}) {
  const errorMessage = computed(() => {
    const item = unref(params.item)
    if (!item) return null

    const itemError = item.error
    if (itemError) return itemError.message

    const uploadError = item.result?.uploadError
    if (uploadError) return uploadError

    return null
  })

  const progressBarColorClass = computed(() => {
    const item = unref(params.item)
    if (errorMessage.value) return 'bg-danger'
    if (item && item.progress >= 100) return 'bg-success'
    return 'bg-primary'
  })

  const progressBarClasses = computed(() => {
    return ['h-1', progressBarColorClass.value].join(' ')
  })

  const progressBarStyle = computed((): CSSProperties => {
    const item = unref(params.item)
    return {
      width: `${item ? item.progress : 0}%`
    }
  })

  return { errorMessage, progressBarClasses, progressBarStyle }
}
