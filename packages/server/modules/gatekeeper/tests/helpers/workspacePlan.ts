import { WorkspacePlan } from '@speckle/shared'
import { assign } from 'lodash'

export const buildTestWorkspacePlan = (
  overrides?: Partial<WorkspacePlan>
): WorkspacePlan =>
  assign(
    {
      workspaceId: '',
      createdAt: '',
      updatedAt: '',
      name: '',
      status: ''
    },
    overrides
  )
