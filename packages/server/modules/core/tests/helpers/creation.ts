import cryptoRandomString from 'crypto-random-string'
import { Project } from '@/modules/core/domain/streams/types'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import { assign } from 'lodash'
import { BasicTestCommit } from '@/test/speckle-helpers/commitHelper'
import { BasicTestBranch } from '@/test/speckle-helpers/branchHelper'
import { BasicTestStream } from '@/test/speckle-helpers/streamHelper'

export const buildTestProject = (overrides?: Partial<Project>): Project =>
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

export const buildBasicTestProject = (
  overrides?: Partial<BasicTestStream>
): BasicTestStream =>
  assign(
    {
      name: cryptoRandomString({ length: 10 }),
      isPublic: true,
      ownerId: cryptoRandomString({ length: 10 }),
      id: cryptoRandomString({ length: 10 })
    },
    overrides
  )

export const buildBasicTestModel = (
  overrides?: Partial<BasicTestBranch>
): BasicTestBranch =>
  assign(
    {
      name: cryptoRandomString({ length: 10 }),
      description: cryptoRandomString({ length: 10 }),
      streamId: cryptoRandomString({ length: 10 }),
      authorId: cryptoRandomString({ length: 10 }),
      id: cryptoRandomString({ length: 10 })
    },
    overrides
  )

export const buildBasicTestVersion = (
  overrides?: Partial<BasicTestCommit>
): BasicTestCommit =>
  assign(
    {
      id: cryptoRandomString({ length: 10 }),
      objectId: cryptoRandomString({ length: 10 }),
      streamId: cryptoRandomString({ length: 10 }),
      authorId: cryptoRandomString({ length: 10 }),
      branchId: cryptoRandomString({ length: 10 }),
      branchName: cryptoRandomString({ length: 10 }),
      message: cryptoRandomString({ length: 10 }),
      createdAt: new Date()
    },
    overrides
  )
