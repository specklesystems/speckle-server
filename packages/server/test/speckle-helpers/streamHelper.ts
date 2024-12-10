import { db } from '@/db/knex'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import {
  addStreamInviteAcceptedActivityFactory,
  addStreamPermissionsAddedActivityFactory,
  addStreamPermissionsRevokedActivityFactory
} from '@/modules/activitystream/services/streamActivity'
import { StreamAcl } from '@/modules/core/dbSchema'
import { ProjectsEmitter } from '@/modules/core/events/projectsEmitter'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  createStreamFactory,
  getStreamCollaboratorsFactory,
  getStreamFactory,
  grantStreamPermissionsFactory,
  revokeStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import { getUserFactory, getUsersFactory } from '@/modules/core/repositories/users'
import {
  addOrUpdateStreamCollaboratorFactory,
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
import { getDefaultRegionFactory } from '@/modules/workspaces/repositories/regions'
import { createWorkspaceProjectFactory } from '@/modules/workspaces/services/projects'
import { BasicTestUser } from '@/test/authHelper'
import { ProjectVisibility } from '@/test/graphql/generated/graphql'
import { faker } from '@faker-js/faker'
import { ensureError, Roles, StreamRoles } from '@speckle/shared'
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

const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory({
  validateStreamAccess,
  getUser,
  grantStreamPermissions: grantStreamPermissionsFactory({ db }),
  addStreamInviteAcceptedActivity: addStreamInviteAcceptedActivityFactory({
    saveActivity,
    publish
  }),
  addStreamPermissionsAddedActivity: addStreamPermissionsAddedActivityFactory({
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
  let id: string
  if (streamObj.workspaceId) {
    const createWorkspaceProject = createWorkspaceProjectFactory({
      getDefaultRegion: getDefaultRegionFactory({ db })
    })
    const newProject = await createWorkspaceProject({
      input: {
        name: streamObj.name || faker.commerce.productName(),
        description: streamObj.description,
        visibility: streamObj.isPublic
          ? ProjectVisibility.Public
          : ProjectVisibility.Private,
        workspaceId: streamObj.workspaceId
      },
      ownerId: owner.id
    })
    id = newProject.id
  } else {
    id = await createStream({
      ...omit(streamObj, ['id', 'ownerId']),
      ownerId: owner.id
    })
  }

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

export async function addToStream(
  streamObj: BasicTestStream,
  user: BasicTestUser,
  role: StreamRoles,
  options?: Partial<{
    owner: BasicTestUser
  }>
) {
  const { owner } = options || {}
  let ownerId = owner?.id
  if (!ownerId) {
    const getStreamCollaborators = getStreamCollaboratorsFactory({ db })
    const collaborators = await getStreamCollaborators(
      streamObj.id,
      Roles.Stream.Owner,
      {
        limit: 1
      }
    )
    ownerId = collaborators[0]?.id
  }
  if (!ownerId) {
    throw new Error('Attempted to add a collaborator to a stream without an owner')
  }

  await addOrUpdateStreamCollaborator(streamObj.id, user.id, role, ownerId, null)
}

export async function addAllToStream(
  streamObj: BasicTestStream,
  users: BasicTestUser[] | { user: BasicTestUser; role: StreamRoles }[],
  options?: Partial<{
    owner: BasicTestUser
  }>
) {
  const { owner } = options || {}
  let ownerId = owner?.id
  if (!ownerId) {
    const getStreamCollaborators = getStreamCollaboratorsFactory({ db })
    const collaborators = await getStreamCollaborators(
      streamObj.id,
      Roles.Stream.Owner,
      {
        limit: 1
      }
    )
    ownerId = collaborators[0]?.id
  }
  if (!ownerId) {
    throw new Error('Attempted to add a collaborator to a stream without an owner')
  }

  const usersWithRoles = users.map((u) =>
    'user' in u ? u : { user: u, role: Roles.Stream.Contributor }
  )
  await Promise.all(
    usersWithRoles.map(({ user, role }) =>
      addOrUpdateStreamCollaborator(streamObj.id, user.id, role, ownerId!, null)
    )
  )
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
