import { blobUploadStatus } from './consts.js'

export type BlobUploadStatus = (typeof blobUploadStatus)[keyof typeof blobUploadStatus]
