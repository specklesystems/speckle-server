import { difference, intersection } from 'lodash'
import { md5 } from '@speckle/shared'
import type { Nullable } from '@speckle/shared'
import { BaseError } from '~~/src/helpers/common/error'

export type FileTypeSpecifier = UniqueFileTypeSpecifier | `.${string}`

export enum UniqueFileTypeSpecifier {
  AnyAudio = 'audio/*',
  AnyVideo = 'video/*',
  AnyImage = 'image/*'
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
    if (allowedExtension.toLowerCase() === fileExt.toLowerCase()) return true
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

export class MissingFileExtensionError extends BaseError {
  static defaultMessage = 'The selected file has a missing extension'
}

export class ForbiddenFileTypeError extends BaseError {
  static defaultMessage = 'The selected file type is forbidden'
}
