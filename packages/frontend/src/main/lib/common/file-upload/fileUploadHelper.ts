import { BaseError } from '@/helpers/errorHelper'
import md5 from '@/helpers/md5'
import { Nullable, Optional } from '@/helpers/typeHelpers'
import { BlobPostResultItem } from '@/main/lib/common/file-upload/blobStorageApi'
import { difference, has, intersection } from 'lodash'

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

/**
 * A file once it's upload has started
 */
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

export type FilesSelectedEvent = { files: UploadableFileItem[] }

export type FileUploadDeleteEvent = { id: string }

export type FileTypeSpecifier = UniqueFileTypeSpecifier | `.${string}`

export enum UniqueFileTypeSpecifier {
  AnyAudio = 'audio/*',
  AnyVideo = 'video/*',
  AnyImage = 'image/*'
}

function isUploadFileItem(
  uploadable: UploadableFileItem
): uploadable is UploadFileItem {
  return has(uploadable, 'progress') || has(uploadable, 'result')
}

export function isSuccessfullyUploaded(upload: UploadFileItem): boolean {
  return !!upload.result?.blobId
}

/**
 * Validate if the upload is fully processed (successfully or not)
 */
export function isUploadProcessed(
  upload: UploadableFileItem | UploadFileItem
): boolean {
  if (upload.error) return true
  if (isUploadFileItem(upload)) {
    return upload.progress >= 100
  }

  return false
}

/**
 * Validate if file has the allowed type. While we could also test for MIME types
 * not in UniqueFileTypeSpecifier, this function is meant to be equivalent to the
 * 'accept' attribute, which only allows for extensions or UniqueFileTypeSpecifier
 * values.
 * @param file
 * @param allowedTypes The file must have one of these types
 * @returns True if valid, Error object if not
 */
export function validateFileType(
  file: File,
  allowedTypes: FileTypeSpecifier[]
): true | Error {
  // Check one of the unique file type specifiers first
  const allowedUniqueTypes = intersection(
    Object.values(UniqueFileTypeSpecifier),
    allowedTypes
  )
  for (const allowedUniqueType of allowedUniqueTypes) {
    switch (allowedUniqueType) {
      case UniqueFileTypeSpecifier.AnyAudio:
        if (file.type.startsWith('audio')) return true
        break
      case UniqueFileTypeSpecifier.AnyImage:
        if (file.type.startsWith('image')) return true
        break
      case UniqueFileTypeSpecifier.AnyVideo:
        if (file.type.startsWith('video')) return true
        break
    }
  }

  // Check file extensions
  const allowedExtensions = difference(allowedTypes, allowedUniqueTypes)
  const fileExt = resolveFileExtension(file.name)
  if (!fileExt) return new MissingFileExtensionError()

  for (const allowedExtension of allowedExtensions) {
    if (allowedExtension === fileExt.toLowerCase()) return true
  }

  return new ForbiddenFileTypeError()
}

/**
 * Resolve file extension (with leading dot)
 */
export function resolveFileExtension(fileName: string): Nullable<FileTypeSpecifier> {
  const ext = fileName.split('.').pop() || null
  return ext ? `.${ext}` : null
}

/**
 * Check if string is a FileTypeSpecifier
 */
export function isFileTypeSpecifier(type: string): type is FileTypeSpecifier {
  return (
    type.startsWith('.') ||
    Object.values(UniqueFileTypeSpecifier as Record<string, string>).includes(type)
  )
}

/**
 * Create a human readable file size string from the numeric size in bytes
 */
export function prettyFileSize(sizeInBytes: number): string {
  const removeTrailingZeroes = (fileSize: number) =>
    parseFloat(fileSize.toFixed(2)).toString()

  if (sizeInBytes < 1024) {
    return `${sizeInBytes}bytes`
  }

  const kbSize = sizeInBytes / 1024
  if (kbSize < 1024) {
    return `${removeTrailingZeroes(kbSize)}KB`
  }

  const mbSize = kbSize / 1024
  if (mbSize < 1024) {
    return `${removeTrailingZeroes(mbSize)}MB`
  }

  const gbSize = mbSize / 1024
  return `${removeTrailingZeroes(gbSize)}GB`
}

/**
 * Generate an ID that uniquely identifies a specific file. The same file
 * will always have the same ID.
 */
export function generateFileId(file: File): string {
  const importantData = {
    name: file.name,
    lastModified: file.lastModified,
    size: file.size,
    type: file.type
  }

  return md5(JSON.stringify(importantData))
}

export class ForbiddenFileTypeError extends BaseError {
  static defaultMessage = 'The selected file type is forbidden'
}

export class MissingFileExtensionError extends BaseError {
  static defaultMessage = 'The selected file has a missing extension'
}

export class FileTooLargeError extends BaseError {
  static defaultMessage = "The selected file's size is too large"
}
