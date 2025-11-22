// eslint-disable-next-line no-restricted-imports
import '../bootstrap'

import { configureClient } from '@/knexfile'
import {
  getBatchedStreamCommentsFactory,
  getCommentLinksFactory,
  insertCommentLinksFactory,
  insertCommentsFactory
} from '@/modules/comments/repositories/comments'
import { StreamAcl } from '@/modules/core/dbSchema'
import { RegionalProjectCreationError } from '@/modules/core/errors/projects'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import {
  ProjectRecordVisibility,
  StreamAclRecord,
  StreamRecord
} from '@/modules/core/helpers/types'
import { UserRecord } from '@/modules/core/helpers/userHelper'
import {
  getBatchedStreamBranchesFactory,
  insertBranchesFactory
} from '@/modules/core/repositories/branches'
import {
  getAllBranchCommitsFactory,
  insertBranchCommitsFactory,
  insertCommitsFactory,
  insertStreamCommitsFactory
} from '@/modules/core/repositories/commits'
import {
  getBatchedStreamObjectsFactory,
  getStreamObjectCountFactory,
  insertObjectsFactory
} from '@/modules/core/repositories/objects'
import {
  deleteProjectFactory,
  getProjectFactory,
  storeProjectFactory
} from '@/modules/core/repositories/projects'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  getStreamCollaboratorsFactory,
  grantStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory,
  findVerifiedEmailsByUserIdFactory
} from '@/modules/core/repositories/userEmails'
import {
  countAdminUsersFactory,
  getUserFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { createUserFactory } from '@/modules/core/services/users/management'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import {
  createWorkspaceSeatFactory,
  getWorkspaceUserSeatFactory
} from '@/modules/gatekeeper/repositories/workspaceSeat'
import {
  getAvailableRegionConfig,
  getMainRegionConfig
} from '@/modules/multiregion/regionConfig'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import { executeBatchedSelect } from '@/modules/shared/helpers/dbHelper'
import { getStringFromEnv } from '@/modules/shared/helpers/envHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getTotalStreamCountFactory } from '@/modules/stats/repositories'
import { getDefaultRegionFactory } from '@/modules/workspaces/repositories/regions'
import {
  getWorkspaceFactory,
  getWorkspaceRoleForUserFactory,
  getWorkspaceRolesFactory,
  getWorkspaceWithDomainsFactory,
  upsertWorkspaceRoleFactory
} from '@/modules/workspaces/repositories/workspaces'
import { getPendingWorkspaceCollaboratorsFactory } from '@/modules/workspaces/services/invites'
import { addOrUpdateWorkspaceRoleFactory } from '@/modules/workspaces/services/management'
import {
  assignWorkspaceSeatFactory,
  ensureValidWorkspaceRoleSeatFactory,
  getWorkspaceDefaultSeatTypeFactory
} from '@/modules/workspaces/services/workspaceSeat'
import { retry } from '@lifeomic/attempt'
import { Roles, wait } from '@speckle/shared'
import knex, { Knex } from 'knex'
import { omit } from 'lodash'

// The workspace on the target server to migrate source server projects to
const TARGET_WORKSPACE_ID = 'c7b72647ea'

// The workspace admin to grant fallback ownership to for all assets (e.g.)
const TARGET_WORKSPACE_ROOT_ADMIN_USER_ID = '7bfea93280'

const ENABLE_USER_PROVISIONING = true

// Note: source connection is configured with connection string in named env variable
const getSourceServerConnection = async () => {
  const sourceDbConnection = getStringFromEnv('SOURCE_DB_CONNECTION')
  const sourceDb = knex(sourceDbConnection)
  return { sourceDb }
}

// Note: target connection is configured with multiregion config file
const getTargetServerConnection = async (targetWorkspaceId: string) => {
  const targetMainDbConfig = await getMainRegionConfig()
  const targetMainDb = configureClient(targetMainDbConfig).public as Knex

  const workspace = await getWorkspaceFactory({ db: targetMainDb })({
    workspaceId: targetWorkspaceId
  })
  if (!workspace) throw Error('Target workspace not found')

  let targetRegionDb = targetMainDb

  const workspaceRegion = await getDefaultRegionFactory({ db: targetMainDb })({
    workspaceId: targetWorkspaceId
  })
  if (workspaceRegion) {
    const targetWorkspaceRegionConfig = (await getAvailableRegionConfig())[
      workspaceRegion.key
    ]
    targetRegionDb = configureClient(targetWorkspaceRegionConfig).public
  }

  return {
    targetMainDb,
    targetRegionDb,
    targetWorkspaceRegionKey: workspaceRegion?.key ?? null
  }
}

const main = async () => {
  const { sourceDb } = await getSourceServerConnection()
  const { targetMainDb, targetRegionDb, targetWorkspaceRegionKey } =
    await getTargetServerConnection(TARGET_WORKSPACE_ID)

  // Establish mapping of source server user ids to target server user ids
  const sourceUsers: UserRecord[] = []
  const userIdMapping: Record<string, string | null> = {}

  const addOrUpdateWorkspaceRole = addOrUpdateWorkspaceRoleFactory({
    getWorkspaceRoles: getWorkspaceRolesFactory({ db: targetMainDb }),
    getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db: targetMainDb }),
    findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({ db: targetMainDb }),
    upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db: targetMainDb }),
    emitWorkspaceEvent: getEventBus().emit,
    ensureValidWorkspaceRoleSeat: ensureValidWorkspaceRoleSeatFactory({
      createWorkspaceSeat: createWorkspaceSeatFactory({ db: targetMainDb }),
      getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db: targetMainDb }),
      getWorkspaceDefaultSeatType: getWorkspaceDefaultSeatTypeFactory({
        getWorkspace: getWorkspaceFactory({ db: targetMainDb })
      }),
      eventEmit: getEventBus().emit
    }),
    assignWorkspaceSeat: assignWorkspaceSeatFactory({
      createWorkspaceSeat: createWorkspaceSeatFactory({ db: targetMainDb }),
      getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({ db: targetMainDb }),
      getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db: targetMainDb }),
      eventEmit: getEventBus().emit
    })
  })

  for await (const users of executeBatchedSelect(
    sourceDb.table<UserRecord>('users').select('*')
  )) {
    for (const user of users) {
      sourceUsers.push(user)

      const userEmail = await findEmailFactory({ db: targetMainDb })({
        email: user.email.toLowerCase(),
        verified: true
      })

      userIdMapping[user.id] = userEmail?.userId ?? null

      // Optionally, provision users from source server on target server
      // TODO: This is only possible if the target workspace has SSO enabled
      if (ENABLE_USER_PROVISIONING) {
        const unverifiedUserEmail = await findEmailFactory({ db: targetMainDb })({
          email: user.email.toLowerCase(),
          verified: false
        })

        if (!!unverifiedUserEmail) {
          // User exists with unverified email, skip
          continue
        }

        if (!!userEmail) {
          // Do not re-provision devops or other speckle accounts
          if (userEmail.email.includes('speckle.systems')) continue
          // User exists with verified email, add them to workspace
          await addOrUpdateWorkspaceRole({
            userId: userEmail.userId,
            workspaceId: TARGET_WORKSPACE_ID,
            role: Roles.Workspace.Member,
            updatedByUserId: TARGET_WORKSPACE_ROOT_ADMIN_USER_ID,
            preventRoleDowngrade: true
          })
          continue
        }

        // const pendingWorkspaceInvites = await getPendingWorkspaceCollaboratorsFactory({
        //   queryAllResourceInvites: queryAllResourceInvitesFactory({ db: targetMainDb }),
        //   getInvitationTargetUsers: getInvitationTargetUsersFactory({
        //     getUsers: getUsersFactory({ db: targetMainDb })
        //   })
        // })({
        //   workspaceId: TARGET_WORKSPACE_ID
        // })

        // if (!pendingWorkspaceInvites.some((invite) => invite.email === user.email)) {
        //   // User does not have an active invite
        //   continue
        // }

        try {
          const newUserId = await createUserFactory({
            getServerInfo: getServerInfoFactory({ db: targetMainDb }),
            findEmail: findEmailFactory({ db: targetMainDb }),
            storeUser: storeUserFactory({ db: targetMainDb }),
            countAdminUsers: countAdminUsersFactory({ db: targetMainDb }),
            storeUserAcl: storeUserAclFactory({ db: targetMainDb }),
            validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
              createUserEmail: createUserEmailFactory({ db: targetMainDb }),
              ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({
                db: targetMainDb
              }),
              findEmail: findEmailFactory({ db: targetMainDb }),
              updateEmailInvites: finalizeInvitedServerRegistrationFactory({
                deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({
                  db: targetMainDb
                }),
                updateAllInviteTargets: updateAllInviteTargetsFactory({
                  db: targetMainDb
                })
              }),
              requestNewEmailVerification: requestNewEmailVerificationFactory({
                findEmail: findEmailFactory({ db: targetMainDb }),
                getUser: getUserFactory({ db: targetMainDb }),
                getServerInfo: getServerInfoFactory({ db: targetMainDb }),
                deleteOldAndInsertNewVerification:
                  deleteOldAndInsertNewVerificationFactory({
                    db: targetMainDb
                  }),
                renderEmail,
                sendEmail
              })
            }),
            emitEvent: getEventBus().emit
          })({
            ...user
          })

          userIdMapping[user.id] = newUserId

          await addOrUpdateWorkspaceRoleFactory({
            getWorkspaceRoles: getWorkspaceRolesFactory({ db: targetMainDb }),
            getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({
              db: targetMainDb
            }),
            findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({
              db: targetMainDb
            }),
            upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db: targetMainDb }),
            emitWorkspaceEvent: getEventBus().emit,
            ensureValidWorkspaceRoleSeat: ensureValidWorkspaceRoleSeatFactory({
              createWorkspaceSeat: createWorkspaceSeatFactory({ db: targetMainDb }),
              getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db: targetMainDb }),
              getWorkspaceDefaultSeatType: getWorkspaceDefaultSeatTypeFactory({
                getWorkspace: getWorkspaceFactory({ db: targetMainDb })
              }),
              eventEmit: getEventBus().emit
            }),
            assignWorkspaceSeat: assignWorkspaceSeatFactory({
              createWorkspaceSeat: createWorkspaceSeatFactory({ db: targetMainDb }),
              getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({
                db: targetMainDb
              }),
              eventEmit: getEventBus().emit,
              getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db: targetMainDb })
            })
          })({
            userId: newUserId,
            workspaceId: TARGET_WORKSPACE_ID,
            role: Roles.Workspace.Member,
            preventRoleDowngrade: true,
            updatedByUserId: TARGET_WORKSPACE_ROOT_ADMIN_USER_ID
          })
        } catch {
          continue
        }
      }
    }
  }

  const workspaceAcls = await getWorkspaceRolesFactory({ db: targetMainDb })({
    workspaceId: TARGET_WORKSPACE_ID
  })

  const sourceServerUserCount = Object.keys(userIdMapping).length
  const targetServerUserCount = Object.values(userIdMapping).filter((id) => !!id).length

  console.log(
    `${targetServerUserCount} of ${sourceServerUserCount} users provisioned on target server.`
  )

  // Begin moving project data
  const sourceServerProjectCount = await getTotalStreamCountFactory({ db: sourceDb })()
  let currentProjectIndex = 0

  const skippedProjects: StreamRecord[] = []

  const { targetRegionDb: largeProjectDb } = await getTargetServerConnection(
    TARGET_WORKSPACE_ID
  )

  for await (const sourceProjects of executeBatchedSelect(
    sourceDb.table<StreamRecord>('streams').select('*')
  )) {
    for (const sourceProject of sourceProjects) {
      currentProjectIndex++
      const logKey = `(${currentProjectIndex
        .toString()
        .padStart(4, '0')}/${sourceServerProjectCount.toString().padStart(4, '0')}) ${
        sourceProject.id
      } `

      // Move project and await replication
      console.log(`${logKey} Moving ${sourceProject.name}`)

      const existingProject = await getProjectFactory({ db: targetRegionDb })({
        projectId: sourceProject.id
      })

      if (
        sourceProject.id !== '80643e0e3c' &&
        (existingProject || sourceProject.name.includes('First Project'))
      ) {
        console.log(`${logKey} Skipping ${sourceProject.name} ${sourceProject.id}`)
        if (existingProject) {
          skippedProjects.push(existingProject)
        }
        continue
      }

      const projectVisibilityMap: Record<
        ProjectRecordVisibility,
        ProjectRecordVisibility
      > = {
        private: 'private',
        workspace: 'workspace',
        public: 'workspace'
      }

      // TODO: Why is initial write wrapped in a transaction?
      await storeProjectFactory({ db: targetRegionDb })({
        project: {
          ...sourceProject,
          regionKey: targetWorkspaceRegionKey,
          workspaceId: TARGET_WORKSPACE_ID,
          visibility: projectVisibilityMap[sourceProject.visibility]
        }
      })

      try {
        await retry(
          async () => {
            await getProjectFactory({ db: targetMainDb })({
              projectId: sourceProject.id
            })
          },
          { maxAttempts: 100 }
        )
      } catch (err) {
        if (err instanceof StreamNotFoundError) {
          // delete from region
          await deleteProjectFactory({ db: targetRegionDb })({
            projectId: sourceProject.id
          })
          throw new RegionalProjectCreationError()
        }
        // else throw as is
        throw err
      }

      await wait(5000)

      const mainTrx = await targetMainDb.transaction()
      const grantStreamPermissions = grantStreamPermissionsFactory({ db: mainTrx })

      console.log(`${logKey} Replicated ${sourceProject.name}`)

      // Move project data
      const regionTrx = await targetRegionDb.transaction()

      try {
        // stream meta not needed, currently it only holds info about the onboarding project
        // stream favorites is ignored

        // Move objects
        const sourceProjectObjectCount = await getStreamObjectCountFactory({
          db: sourceDb
        })({ streamId: sourceProject.id })
        let movedObjectsCount = 0

        const objectDb =
          sourceProjectObjectCount > 1_000_000 ? largeProjectDb : regionTrx

        for await (const objectsBatch of getBatchedStreamObjectsFactory({
          db: sourceDb
        })(sourceProject.id, { batchSize: 500 })) {
          await insertObjectsFactory({ db: objectDb })(objectsBatch)

          movedObjectsCount = movedObjectsCount + objectsBatch.length
          console.log(
            `${logKey} ${movedObjectsCount
              .toString()
              .padStart(6, '0')}/${sourceProjectObjectCount
              .toString()
              .padStart(6, '0')} objects moved`
          )
        }

        // object previews are ignored, they will be regenerated when requested

        // Move branches
        const branchIds: string[] = []
        let movedBranchCount = 0

        for await (const branchBatch of getBatchedStreamBranchesFactory({
          db: sourceDb
        })(sourceProject.id)) {
          const branchesAuthorRemapped = branchBatch.map((b) => {
            branchIds.push(b.id)
            if (!b.authorId) return b
            if (!(b.authorId in userIdMapping)) throw new Error('Unknown branch author')
            return {
              ...b,
              authorId: userIdMapping[b.authorId] ?? TARGET_WORKSPACE_ROOT_ADMIN_USER_ID
            }
          })
          if (branchesAuthorRemapped.length) {
            await insertBranchesFactory({ db: regionTrx })(branchesAuthorRemapped)
          }
          movedBranchCount = movedBranchCount + branchesAuthorRemapped.length
          console.log(`${logKey} ${movedBranchCount} branches moved`)
        }

        // Move commits
        const sc: { streamId: string; commitId: string }[] = []
        const bc: { branchId: string; commitId: string }[] = []

        const branchCommits = await getAllBranchCommitsFactory({ db: sourceDb })({
          projectId: sourceProject.id
        })
        for (const [branchId, commitBatch] of Object.entries(branchCommits)) {
          if (commitBatch.length === 0) {
            continue
          }

          const commitsRemapped = commitBatch.map((c) => {
            sc.push({ streamId: sourceProject.id, commitId: c.id })
            bc.push({ branchId, commitId: c.id })
            if (!c.author) return omit(c, 'branchId')
            const commit = {
              ...c,
              author: userIdMapping[c.author] ?? TARGET_WORKSPACE_ROOT_ADMIN_USER_ID
            }

            // yeah, that is added by the repo function...
            return omit(commit, 'branchId')
          })
          console.log(commitsRemapped.length)
          if (commitsRemapped.length) {
            await insertCommitsFactory({ db: regionTrx })(commitsRemapped)
          }

          console.log(`${logKey} ${Object.keys(sc).length} commits moved`)
        }

        // stream_commits
        if (sc.length) {
          await insertStreamCommitsFactory({ db: regionTrx })(sc)
        }
        // branch_commits
        if (bc.length) {
          await insertBranchCommitsFactory({ db: regionTrx })(bc)
        }

        // Move comments
        const commentIds: string[] = []
        for await (const commentBatch of getBatchedStreamCommentsFactory({
          db: sourceDb
        })(sourceProject.id)) {
          const commentsRemapped = commentBatch
            .map((c) => {
              if (c.text)
                return {
                  ...c,
                  authorId:
                    userIdMapping?.[c.authorId] ?? TARGET_WORKSPACE_ROOT_ADMIN_USER_ID
                }
            })
            .filter((c) => c !== undefined)
          // TODO: this borks the createdAt date !!!!!
          // TODO: why is the text null in the return object?
          if (commentsRemapped.length) {
            // @ts-expect-error comments are always text
            await insertCommentsFactory({ db: regionTrx })(commentsRemapped)
            commentIds.push(...commentsRemapped.map((comment) => comment.id))
          }
          console.log(`${logKey} ${commentIds.length} comments moved`)
        }

        // comment links
        if (commentIds.length) {
          const commentLinks = await getCommentLinksFactory({ db: sourceDb })(
            commentIds
          )
          await insertCommentLinksFactory({ db: regionTrx })(commentLinks)
        }

        // skipping file uploads and blobs, there is none of that in the current source
        // file uploads
        // blobs

        // skipping webhooks, there is not of that in the current source
        // webhooks_config
        // webhooks_events

        // Assign project roles
        const existingStreamCollaborators = await getStreamCollaboratorsFactory({
          db: sourceDb
        })(sourceProject.id, undefined, { limit: 150 })

        // Give admin role
        await grantStreamPermissions({
          userId: TARGET_WORKSPACE_ROOT_ADMIN_USER_ID,
          streamId: sourceProject.id,
          role: Roles.Stream.Owner
        })

        // Assign existing roles to project members
        // TODO: Assign seats as well, or demote with invalid seat?
        const assignWorkspaceSeat = assignWorkspaceSeatFactory({
          createWorkspaceSeat: createWorkspaceSeatFactory({ db: mainTrx }),
          getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({ db: mainTrx }),
          getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db: mainTrx }),
          eventEmit: getEventBus().emit
        })

        for (const user of existingStreamCollaborators) {
          const targetServerUserId = userIdMapping[user.id]
          if (!targetServerUserId) continue

          if (!workspaceAcls.find((acl) => acl.userId === targetServerUserId)) {
            // Project member user exists on server but not in workspace
            console.log(
              `User ${user.name} (${user.id}) not in workspace. Removing from project.`
            )
            continue
          }

          // Will throw if user does not have valid seat for role
          await mainTrx
            .table<StreamAclRecord>('stream_acl')
            .insert({
              userId: targetServerUserId,
              resourceId: sourceProject.id,
              role: user.streamRole
            })
            .onConflict([
              StreamAcl.withoutTablePrefix.col.userId,
              StreamAcl.withoutTablePrefix.col.resourceId
            ])
            .merge(['role'])
          await assignWorkspaceSeat({
            userId: targetServerUserId,
            workspaceId: TARGET_WORKSPACE_ID,
            type: 'editor',
            assignedByUserId: TARGET_WORKSPACE_ROOT_ADMIN_USER_ID
          })
        }

        // // Try to assign roles
        // for (const user of sourceUsers) {
        //   // stream_acl is calculated based on the users workspace role and the original role
        //   if (!(user.id in userIdMapping))
        //     throw new Error('cannot find source user in mapping')
        //   const userId = userIdMapping[user.id]
        //   if (!userId) continue
        //   let role: StreamRoles | null = null

        //   const existingCollaborator = existingStreamCollaborators.find(
        //     (c) => c.id === user.id
        //   )
        //   if (existingCollaborator) {
        //     role = existingCollaborator.streamRole
        //   }
        //   const workspaceAcl = workspaceAcls.find((w) => w.userId === userId)
        //   if (!workspaceAcl) continue
        //   if (workspaceAcl.role === Roles.Workspace.Admin) {
        //     role = Roles.Stream.Owner
        //   }
        //   if (!role && workspaceAcl.role === Roles.Workspace.Member) {
        //     const seatType = await getWorkspaceRoleAndSeatFactory({ db: targetMainDb })(
        //       {
        //         workspaceId: TARGET_WORKSPACE_ID,
        //         userId
        //       }
        //     )
        //     if (!seatType) {
        //       continue
        //     }
        //     switch (seatType.seat.type) {
        //       case WorkspaceSeatType.Editor: {
        //         role = Roles.Stream.Contributor
        //         break
        //       }
        //       case WorkspaceSeatType.Viewer: {
        //         role = Roles.Stream.Reviewer
        //         break
        //       }
        //     }
        //   }

        //   // guest can be ignored, they get roles from the original project role
        //   if (role)
        //     await grantStreamPermissions({ userId, streamId: sourceProject.id, role })
        // }

        await mainTrx.commit()
        await regionTrx.commit()
      } catch (err) {
        await regionTrx.rollback()
        // Rollback ?
        await mainTrx.rollback()
        // cleanup the project from the DB
        await deleteProjectFactory({ db: targetRegionDb })({
          projectId: sourceProject.id
        })
        throw err
      }
    }
  }

  console.log(`Skipped ${skippedProjects.length} projects:`)
  for (const project of skippedProjects) {
    console.log(`${project.id} ${project.name}`)
  }
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.log(e))

//   // getting users here, to make sure they all exist
//   // const sourceUsers = await getUsersFactory({ db: sourceDb })(
//   //   Object.keys(userIdMapping)
//   // )
//   const sourceProjects = await getStreamsFactory({ db: sourceDb })(projectIds)
//   // const workspaceAcls = await getWorkspaceRolesFactory({ db: mainDb })({
//   //   workspaceId
//   // })

//   for (const sourceProject of sourceProjects) {
//     // starting first trx here
//     let regionTrx = await regionDb.transaction()
//     const mainTrx = await mainDb.transaction()

//     const grantStreamPermissions = grantStreamPermissionsFactory({ db: mainTrx })
//     await storeProjectFactory({ db: regionTrx })({
//       project: {
//         ...sourceProject,
//         regionKey: workspaceRegion?.key || null,
//         workspaceId
//       }
//     })

//     // need to wait for project replication somewhere
//     // so first transaction gets committed here
//     await regionTrx.commit()

//     try {
//       await retry(
//         async () => {
//           await getProjectFactory({ db: mainDb })({ projectId: sourceProject.id })
//         },
//         { maxAttempts: 100 }
//       )
//     } catch (err) {
//       if (err instanceof StreamNotFoundError) {
//         // delete from region
//         await deleteProjectFactory({ db: regionDb })({ projectId: sourceProject.id })
//         throw new RegionalProjectCreationError()
//       }
//       // else throw as is
//       throw err
//     }

//     try {
//       regionTrx = await regionDb.transaction()
//       // stream meta not needed, currently it only holds info about the onboarding project
//       // stream favorites is ignored

//       // objects
//       // the heavy stuff done in batches
//       for await (const objectsBatch of getBatchedStreamObjectsFactory({ db: sourceDb })(
//         sourceProject.id,
//         { batchSize: 500 }
//       )) {
//         await insertObjectsFactory({ db: regionTrx })(objectsBatch)
//       }

//       // object previews are ignored, they will be regenerated when requested

//       // branches
//       const branchIds: string[] = []
//       for await (const branchBatch of getBatchedStreamBranchesFactory({ db: sourceDb })(
//         sourceProject.id
//       )) {
//         const branchesAuthorRemapped = branchBatch.map((b) => {
//           branchIds.push(b.id)
//           if (!b.authorId) return b
//           if (!(b.authorId in userIdMapping)) throw new Error('Unknown branch author')
//           return {
//             ...b,
//             authorId: userIdMapping[b.authorId]
//           }
//         })
//         if (branchesAuthorRemapped.length)
//           await insertBranchesFactory({ db: regionTrx })(branchesAuthorRemapped)
//       }

//       // commits
//       const sc: { streamId: string; commitId: string }[] = []
//       const bc: { branchId: string; commitId: string }[] = []

//       const branchCommits = await getAllBranchCommitsFactory({ db: sourceDb })({
//         projectId: sourceProject.id
//       })
//       for (const [branchId, commitBatch] of Object.entries(branchCommits)) {
//         const commitsRemapped = commitBatch.map((c) => {
//           sc.push({ streamId: sourceProject.id, commitId: c.id })
//           bc.push({ branchId, commitId: c.id })
//           if (!c.author) return omit(c, 'branchId')
//           if (!(c.author in userIdMapping)) throw new Error('Unknown commit author')
//           const commit = {
//             ...c,
//             author: userIdMapping[c.author]
//           }

//           // yeah, that is added by the repo function...
//           const omited = omit(commit, 'branchId')
//           return omited
//         })
//         if (commitsRemapped.length)
//           await insertCommitsFactory({ db: regionTrx })(commitsRemapped)
//       }

//       // stream_commits
//       await insertStreamCommitsFactory({ db: regionTrx })(sc)
//       // branch_commits
//       await insertBranchCommitsFactory({ db: regionTrx })(bc)

//       // comments need userId mapping
//       const commentIds: string[] = []
//       for await (const commentBatch of getBatchedStreamCommentsFactory({
//         db: sourceDb
//       })(sourceProject.id)) {
//         const commentsRemapped = commentBatch
//           .map((c) => {
//             if (!(c.authorId in userIdMapping))
//               throw new Error('Comment author not found')
//             if (c.text)
//               return {
//                 ...c,
//                 authorId: userIdMapping[c.authorId]
//               }
//           })
//           .filter((c) => c !== undefined)
//         // TODO: this borks the createdAt date !!!!!
//         // TODO: why is the text null in the return object?
//         if (commentsRemapped.length)
//           // @ts-expect-error comments are always text
//           await insertCommentsFactory({ db: regionTrx })(commentsRemapped)
//       }
//       // comment views need userId mapping
//       // skipping comment views for now, its not essential...

//       // comment links
//       if (commentIds.length) {
//         const commentLinks = await getCommentLinksFactory({ db: sourceDb })(commentIds)
//         await insertCommentLinksFactory({ db: regionTrx })(commentLinks)
//       }

//       // skipping file uploads and blobs, there is none of that in the current source
//       // file uploads
//       // blobs

//       // skipping webhooks, there is not of that in the current source
//       // webhooks_config
//       // webhooks_events

//       const existingStreamCollaborators = await getStreamCollaboratorsFactory({
//         db: sourceDb
//       })(sourceProject.id, undefined, { limit: 100 })

//       for (const user of sourceUsers) {
//         // stream_acl is calculated based on the users workspace role and the original role
//         if (!(user.id in userIdMapping))
//           throw new Error('cannot find source user in mapping')
//         const userId = userIdMapping[user.id]
//         let role: StreamRoles | null = null

//         const existingCollaborator = existingStreamCollaborators.find(
//           (c) => c.id === user.id
//         )
//         if (existingCollaborator) {
//           role = existingCollaborator.streamRole
//         }
//         const workspaceAcl = workspaceAcls.find((w) => w.userId === userId)
//         if (!workspaceAcl) throw new Error('User not member of the workspace')
//         if (workspaceAcl.role === Roles.Workspace.Admin) {
//           role = Roles.Stream.Owner
//         }
//         if (!role && workspaceAcl.role === Roles.Workspace.Member) {
//           role = Roles.Stream.Contributor
//         }

//         // guest can be ignored, they get roles from the original project role
//         if (role)
//           await grantStreamPermissions({ userId, streamId: sourceProject.id, role })
//       }

//       // throw new Error('not ready to commit to this just yet')
//       await mainTrx.commit()
//       await regionTrx.commit()
//     } catch (err) {
//       await regionTrx.rollback()
//       await mainTrx.commit()
//       // cleanup the project from the DB
//       await deleteProjectFactory({ db: regionDb })({ projectId: sourceProject.id })
//       throw err
//     }
//   }
// }
