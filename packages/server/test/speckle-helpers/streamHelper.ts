import { db } from '@/db/knex'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { addStreamPermissionsRevokedActivityFactory } from '@/modules/activitystream/services/streamActivity'
import { StreamAcl } from '@/modules/core/dbSchema'
import { ProjectsEmitter } from '@/modules/core/events/projectsEmitter'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  createStreamFactory,
  getStreamFactory,
  revokeStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import { getUserFactory, getUsersFactory } from '@/modules/core/repositories/users'
import {
  isStreamCollaboratorFactory,
  removeStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import {
  createStreamReturnRecordFactory,
  legacyCreateStreamFactory
} from '@/modules/core/services/streams/management'
import {
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { authorizeResolver } from '@/modules/shared'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { publish } from '@/modules/shared/utils/subscriptions'
import { BasicTestUser } from '@/test/authHelper'
import { ensureError } from '@speckle/shared'
import { omit } from 'lodash'

const getServerInfo = getServerInfoFactory({ db })
const getUsers = getUsersFactory({ db })
const getUser = getUserFactory({ db })
const getStream = getStreamFactory({ db })
const createStream = legacyCreateStreamFactory({
  createStreamReturnRecord: createStreamReturnRecordFactory({
    inviteUsersToProject: inviteUsersToProjectFactory({
      createAndSendInvite: createAndSendInviteFactory({
        findUserByTarget: findUserByTargetFactory({ db }),
        insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
        collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
          getStream
        }),
        buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
          getStream
        }),
        emitEvent: ({ eventName, payload }) =>
          getEventBus().emit({
            eventName,
            payload
          }),
        getUser,
        getServerInfo
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    projectsEventsEmitter: ProjectsEmitter.emit
  })
})

const saveActivity = saveActivityFactory({ db })
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const isStreamCollaborator = isStreamCollaboratorFactory({
  getStream
})
const removeStreamCollaborator = removeStreamCollaboratorFactory({
  validateStreamAccess,
  isStreamCollaborator,
  revokeStreamPermissions: revokeStreamPermissionsFactory({ db }),
  addStreamPermissionsRevokedActivity: addStreamPermissionsRevokedActivityFactory({
    saveActivity,
    publish
  })
})

export type BasicTestStream = {
  name: string
  isPublic: boolean
  /**
   * The ID of the owner user. Will be filled in by createTestStream().
   */
  ownerId: string
  /**
   * The ID of the stream. Will be filled in by createTestStream().
   */
  id: string
} & Partial<StreamRecord>

/**
 * Create multiple test streams with their IDs filled in
 */
export async function createTestStreams(
  streamOwnerPairs: [BasicTestStream, BasicTestUser][]
) {
  await Promise.all(streamOwnerPairs.map((p) => createTestStream(p[0], p[1])))
}

/**
 * Create basic stream for testing and update streamObj to have a real ID
 */
export async function createTestStream(
  streamObj: BasicTestStream,
  owner: BasicTestUser
) {
  const id = await createStream({
    ...omit(streamObj, ['id', 'ownerId']),
    ownerId: owner.id
  })
  streamObj.id = id
  streamObj.ownerId = owner.id
}

export async function leaveStream(streamObj: BasicTestStream, user: BasicTestUser) {
  await removeStreamCollaborator(streamObj.id, user.id, user.id, null).catch((e) => {
    if (ensureError(e).message === 'User is not a stream collaborator') {
      return
    }

    throw e
  })
}

/**
 * Get the role user has for the specified stream
 */
export async function getUserStreamRole(
  userId: string,
  streamId: string
): Promise<Nullable<string>> {
  const entry = await StreamAcl.knex<StreamAclRecord>()
    .where({
      [StreamAcl.col.resourceId]: streamId,
      [StreamAcl.col.userId]: userId
    })
    .first()

  return entry?.role || null
}
