import { BaseError } from '@/modules/shared/errors'

export class WorkspaceRegionAssignmentError extends BaseError {
  static defaultMessage = 'Failed to assign region to workspace'
  static code = 'WORKSPACE_REGION_ASSIGNMENT_ERROR'
  static statusCode = 400
}
