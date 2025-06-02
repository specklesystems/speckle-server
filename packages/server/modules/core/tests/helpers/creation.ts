import cryptoRandomString from 'crypto-random-string'
import { Project } from '@/modules/core/domain/streams/types'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import { assign } from 'lodash'

export const buildBasicTestProject = (overrides?: Partial<Project>): Project =>
  assign(
    {
      id: cryptoRandomString({ length: 10 }),
      name: cryptoRandomString({ length: 10 }),
      description: cryptoRandomString({ length: 10 }),
      clonedFrom: cryptoRandomString({ length: 10 }),
      createdAt: new Date(),
      updatedAt: new Date(),
      allowPublicComments: false,
      workspaceId: cryptoRandomString({ length: 10 }),
      regionKey: cryptoRandomString({ length: 4 }),
      visibility: ProjectRecordVisibility.Private
    },
    overrides
  )
