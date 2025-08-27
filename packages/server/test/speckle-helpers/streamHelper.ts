import { db } from '@/db/knex'
import { StreamAcl } from '@/modules/core/dbSchema'
import { mapDbToGqlProjectVisibility } from '@/modules/core/helpers/project'
import type { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  createStreamFactory,
  getStreamCollaboratorsFactory,
  getStreamFactory,
  getStreamRolesFactory,
  grantStreamPermissionsFactory,
  revokeStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
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
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import {
  deleteInvitesByTargetFactory,
  deleteServerOnlyInvitesFactory,
  findInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import {
  processFinalizedProjectInviteFactory,
  validateProjectInviteBeforeFinalizationFactory
} from '@/modules/serverinvites/services/coreFinalization'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import {
  finalizeInvitedServerRegistrationFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { authorizeResolver } from '@/modules/shared'
import type { Nullable } from '@/modules/shared/helpers/typeHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getDefaultRegionFactory } from '@/modules/workspaces/repositories/regions'
import { createWorkspaceProjectFactory } from '@/modules/workspaces/services/projects'
import type { BasicTestUser } from '@/test/authHelper'
import { ProjectVisibility } from '@/modules/core/graph/generated/graphql'
import { faker } from '@faker-js/faker'
import type { StreamRoles } from '@speckle/shared'
import { ensureError, Roles } from '@speckle/shared'
import { omit } from 'lodash-es'
import { storeProjectRoleFactory } from '@/modules/core/repositories/projects'

const getServerInfo = getServerInfoFactory({ db })
const getUsers = getUsersFactory({ db })
const getUser = getUserFactory({ db })
const getStream = getStreamFactory({ db })

const buildFinalizeProjectInvite = () =>
  finalizeResourceInviteFactory({
    findInvite: findInviteFactory({ db }),
    validateInvite: validateProjectInviteBeforeFinalizationFactory({
      getProject: getStream
    }),
    processInvite: processFinalizedProjectInviteFactory({
      getProject: getStream,
      addProjectRole: addOrUpdateStreamCollaboratorFactory({
        validateStreamAccess: validateStreamAccessFactory({ authorizeResolver }),
        getUser,
        grantStreamPermissions: grantStreamPermissionsFactory({ db }),
        getStreamRoles: getStreamRolesFactory({ db }),
        emitEvent: getEventBus().emit
      })
    }),
    deleteInvitesByTarget: deleteInvitesByTargetFactory({ db }),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    emitEvent: (...args) => getEventBus().emit(...args),
    findEmail: findEmailFactory({ db }),
    validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
      createUserEmail: createUserEmailFactory({ db }),
      ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
      findEmail: findEmailFactory({ db }),
      updateEmailInvites: finalizeInvitedServerRegistrationFactory({
        deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
        updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
      }),
      requestNewEmailVerification: requestNewEmailVerificationFactory({
        findEmail: findEmailFactory({ db }),
        getUser,
        getServerInfo,
        deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({
          db
        }),
        renderEmail,
        sendEmail
      })
    }),
    collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
      getStream
    }),
    getUser,
    getServerInfo
  })

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
        getServerInfo,
        finalizeInvite: buildFinalizeProjectInvite()
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    storeProjectRole: storeProjectRoleFactory({ db }),
    emitEvent: getEventBus().emit
  })
})

const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const isStreamCollaborator = isStreamCollaboratorFactory({
  getStream
})
const removeStreamCollaborator = removeStreamCollaboratorFactory({
  validateStreamAccess,
  isStreamCollaborator,
  revokeStreamPermissions: revokeStreamPermissionsFactory({ db }),
  getStreamRoles: getStreamRolesFactory({ db }),
  emitEvent: getEventBus().emit
})

const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory({
  validateStreamAccess,
  getUser,
  grantStreamPermissions: grantStreamPermissionsFactory({ db }),
  getStreamRoles: getStreamRolesFactory({ db }),
  emitEvent: getEventBus().emit
})

export type BasicTestStream = {
  name: string
  /**
   * @deprecated Use visibility instead
   */
  isPublic?: boolean
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
  return await Promise.all(streamOwnerPairs.map((p) => createTestStream(p[0], p[1])))
}

/**
 * Create basic stream for testing and update streamObj in-place, via reference, to have a real ID
 */
export async function createTestStream<S extends Partial<BasicTestStream>>(
  streamObj: S,
  owner: BasicTestUser
): Promise<S> {
  let id: string

  const visibility = streamObj.isPublic
    ? ProjectVisibility.Public
    : (streamObj.visibility
        ? mapDbToGqlProjectVisibility(streamObj.visibility)
        : undefined) || ProjectVisibility.Private

  if (streamObj.workspaceId) {
    const createWorkspaceProject = createWorkspaceProjectFactory({
      getDefaultRegion: getDefaultRegionFactory({ db })
    })
    const newProject = await createWorkspaceProject({
      input: {
        name: streamObj.name || faker.commerce.productName(),
        description: streamObj.description,
        visibility,
        workspaceId: streamObj.workspaceId
      },
      ownerId: owner.id
    })
    id = newProject.id
  } else {
    id = await createStream({
      ...omit(streamObj, ['id', 'ownerId', 'visibility']),
      isPublic: visibility === ProjectVisibility.Public,
      ownerId: owner.id
    })
  }

  streamObj.id = id
  streamObj.ownerId = owner.id
  return streamObj
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
