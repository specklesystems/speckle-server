import { BaseError } from '@/modules/shared/errors'

export class PreviewProjectOwnerNotFoundError extends BaseError {
  static code = 'PREVIEW_PROJECT_OWNER_NOT_FOUND'
  static defaultMessage =
    'Unable to find an owner of the Project in which we wish to create a preview.'
}
