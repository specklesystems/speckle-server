import { BaseError } from '@/modules/shared/errors/base'

export class InvalidAttachmentsError extends BaseError {
  static defaultMessage = 'Invalid comment attachments specified'
  static code = 'INVALID_ATTACHMENTS'
  static statusCode = 400
}

export class CommentNotFoundError extends BaseError {
  static defaultMessage = 'Comment not found'
  static code = 'COMMENT_NOT_FOUND'
  static statusCode = 404
}

export class CommentCreateError extends BaseError {
  static defaultMessage = 'An error occurred while creating a new comment'
  static code = 'COMMENT_CREATE_ERROR'
  static statusCode = 500
}

export class CommentUpdateError extends BaseError {
  static defaultMessage = 'An error occurred while updating a comment'
  static code = 'COMMENT_UPDATE_ERROR'
  static statusCode = 400
}
