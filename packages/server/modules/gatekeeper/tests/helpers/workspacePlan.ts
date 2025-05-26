import { WorkspacePlan } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import { assign } from 'lodash'

export const buildTestWorkspacePlan = (
  overrides?: Partial<WorkspacePlan>
): WorkspacePlan =>
  assign(
    {
      workspaceId: cryptoRandomString({ length: 10 }),
      createdAt: new Date(),
      updatedAt: new Date(),
      name: 'free',
      status: 'valid'
    },
    overrides
  )
