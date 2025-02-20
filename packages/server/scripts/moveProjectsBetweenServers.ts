// eslint-disable-next-line no-restricted-imports
import '../bootstrap.js'

import { configureClient } from '@/knexfile'
import {
  getBatchedStreamCommentsFactory,
  getCommentLinksFactory,
  insertCommentLinksFactory,
  insertCommentsFactory
} from '@/modules/comments/repositories/comments'
import { RegionalProjectCreationError } from '@/modules/core/errors/projects'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
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
  insertObjectsFactory
} from '@/modules/core/repositories/objects'
import {
  deleteProjectFactory,
  getProjectFactory,
  storeProjectFactory
} from '@/modules/core/repositories/projects'
import {
  getStreamCollaboratorsFactory,
  getStreamsFactory,
  grantStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import { getUsersFactory } from '@/modules/core/repositories/users'
import {
  getAvailableRegionConfig,
  getMainRegionConfig
} from '@/modules/multiregion/regionConfig'
import { getStringFromEnv } from '@/modules/shared/helpers/envHelper'
import { getDefaultRegionFactory } from '@/modules/workspaces/repositories/regions'
import {
  getWorkspaceFactory,
  getWorkspaceRolesFactory
} from '@/modules/workspaces/repositories/workspaces'
import { retry } from '@lifeomic/attempt'
import { Roles, StreamRoles } from '@speckle/shared'
import knex from 'knex'
import { omit } from 'lodash'

const projectIds = [
  'edbf5f099d'
  // '0d2bab6b1b',
  // '2d0431175f',
  // '0d8ebc5d94',
  // 'b171b7dea4',
  // '10492ba7fe',
  // 'e758c11540',
  // '5b25d3c558',
  // 'd1c23f9206',
  // '83f005bbc8',
  // 'f92268dfac',
  // '97e8715da4'
]

// real
// const userIdMapping: Record<string, string> = {
//   '52fb7b2818': 'ee07689e6c', // Aida Ramirez Marrujo
//   a8bbe5fd68: '63147c73f9', // Xintong Chen
//   a736ff389b: 'e31189c187', // Felipe Curado
//   '230687c24c': 'aa5235d45d', // Julian Höll
//   '02d31038bc': '0b567b1cc9' // DT
// }

const userIdMapping: Record<string, string> = {
  '52fb7b2818': 'ee07689e6c', // Aida Ramirez Marrujo
  a8bbe5fd68: 'ee07689e6c', // Xintong Chen
  a736ff389b: 'ee07689e6c', // Felipe Curado
  '230687c24c': 'ee07689e6c', // Julian Höll
  '02d31038bc': 'ee07689e6c' // DT
}

// real
// const workspaceId = 'a1f85661a9'
const workspaceId = '760fd72e88'

const sourceDbConnection = getStringFromEnv('SOURCE_DB_CONNECTION')
const sourceDb = knex(sourceDbConnection)

const main = async () => {
  const targetMainDbConfig = await getMainRegionConfig()
  // get mainDb
  const mainDb = configureClient(targetMainDbConfig).public
  const workspace = await getWorkspaceFactory({ db: mainDb })({ workspaceId })
  if (!workspace) throw Error('Target workspace not found')
  let regionDb = mainDb
  const workspaceRegion = await getDefaultRegionFactory({ db: mainDb })({
    workspaceId
  })
  if (workspaceRegion) {
    const targetWorkspaceRegionConfig = (await getAvailableRegionConfig())[
      workspaceRegion.key
    ]
    regionDb = configureClient(targetWorkspaceRegionConfig).public
  }

  // getting users here, to make sure they all exist
  const sourceUsers = await getUsersFactory({ db: sourceDb })(
    Object.keys(userIdMapping)
  )
  const sourceProjects = await getStreamsFactory({ db: sourceDb })(projectIds)
  const workspaceAcls = await getWorkspaceRolesFactory({ db: mainDb })({
    workspaceId
  })

  for (const sourceProject of sourceProjects) {
    // starting first trx here
    let regionTrx = await regionDb.transaction()
    const mainTrx = await mainDb.transaction()

    const grantStreamPermissions = grantStreamPermissionsFactory({ db: mainTrx })
    await storeProjectFactory({ db: regionTrx })({
      project: {
        ...sourceProject,
        regionKey: workspaceRegion?.key || null,
        workspaceId
      }
    })

    // need to wait for project replication somewhere
    // so first transaction gets committed here
    await regionTrx.commit()

    try {
      await retry(
        async () => {
          await getProjectFactory({ db: mainDb })({ projectId: sourceProject.id })
        },
        { maxAttempts: 100 }
      )
    } catch (err) {
      if (err instanceof StreamNotFoundError) {
        // delete from region
        await deleteProjectFactory({ db: regionDb })({ projectId: sourceProject.id })
        throw new RegionalProjectCreationError()
      }
      // else throw as is
      throw err
    }

    try {
      regionTrx = await regionDb.transaction()
      // stream meta not needed, currently it only holds info about the onboarding project
      // stream favorites is ignored

      // objects
      // the heavy stuff done in batches
      for await (const objectsBatch of getBatchedStreamObjectsFactory({ db: sourceDb })(
        sourceProject.id,
        { batchSize: 500 }
      )) {
        await insertObjectsFactory({ db: regionTrx })(objectsBatch)
      }

      // object previews are ignored, they will be regenerated when requested

      // branches
      const branchIds: string[] = []
      for await (const branchBatch of getBatchedStreamBranchesFactory({ db: sourceDb })(
        sourceProject.id
      )) {
        const branchesAuthorRemapped = branchBatch.map((b) => {
          branchIds.push(b.id)
          if (!b.authorId) return b
          if (!(b.authorId in userIdMapping)) throw new Error('Unknown branch author')
          return {
            ...b,
            authorId: userIdMapping[b.authorId]
          }
        })
        if (branchesAuthorRemapped.length)
          await insertBranchesFactory({ db: regionTrx })(branchesAuthorRemapped)
      }

      // commits
      const sc: { streamId: string; commitId: string }[] = []
      const bc: { branchId: string; commitId: string }[] = []

      const branchCommits = await getAllBranchCommitsFactory({ db: sourceDb })({
        projectId: sourceProject.id
      })
      for (const [branchId, commitBatch] of Object.entries(branchCommits)) {
        const commitsRemapped = commitBatch.map((c) => {
          sc.push({ streamId: sourceProject.id, commitId: c.id })
          bc.push({ branchId, commitId: c.id })
          if (!c.author) return omit(c, 'branchId')
          if (!(c.author in userIdMapping)) throw new Error('Unknown commit author')
          const commit = {
            ...c,
            author: userIdMapping[c.author]
          }

          // yeah, that is added by the repo function...
          const omited = omit(commit, 'branchId')
          return omited
        })
        if (commitsRemapped.length)
          await insertCommitsFactory({ db: regionTrx })(commitsRemapped)
      }

      // stream_commits
      await insertStreamCommitsFactory({ db: regionTrx })(sc)
      // branch_commits
      await insertBranchCommitsFactory({ db: regionTrx })(bc)

      // comments need userId mapping
      const commentIds: string[] = []
      for await (const commentBatch of getBatchedStreamCommentsFactory({
        db: sourceDb
      })(sourceProject.id)) {
        const commentsRemapped = commentBatch
          .map((c) => {
            if (!(c.authorId in userIdMapping))
              throw new Error('Comment author not found')
            if (c.text)
              return {
                ...c,
                authorId: userIdMapping[c.authorId]
              }
          })
          .filter((c) => c !== undefined)
        // TODO: this borks the createdAt date !!!!!
        // TODO: why is the text null in the return object?
        if (commentsRemapped.length)
          // @ts-expect-error comments are always text
          await insertCommentsFactory({ db: regionTrx })(commentsRemapped)
      }
      // comment views need userId mapping
      // skipping comment views for now, its not essential...

      // comment links
      if (commentIds.length) {
        const commentLinks = await getCommentLinksFactory({ db: sourceDb })(commentIds)
        await insertCommentLinksFactory({ db: regionTrx })(commentLinks)
      }

      // skipping file uploads and blobs, there is none of that in the current source
      // file uploads
      // blobs

      // skipping webhooks, there is not of that in the current source
      // webhooks_config
      // webhooks_events

      const existingStreamCollaborators = await getStreamCollaboratorsFactory({
        db: sourceDb
      })(sourceProject.id, undefined, { limit: 100 })

      for (const user of sourceUsers) {
        // stream_acl is calculated based on the users workspace role and the original role
        if (!(user.id in userIdMapping))
          throw new Error('cannot find source user in mapping')
        const userId = userIdMapping[user.id]
        let role: StreamRoles | null = null

        const existingCollaborator = existingStreamCollaborators.find(
          (c) => c.id === user.id
        )
        if (existingCollaborator) {
          role = existingCollaborator.streamRole
        }
        const workspaceAcl = workspaceAcls.find((w) => w.userId === userId)
        if (!workspaceAcl) throw new Error('User not member of the workspace')
        if (workspaceAcl.role === Roles.Workspace.Admin) {
          role = Roles.Stream.Owner
        }
        if (!role && workspaceAcl.role === Roles.Workspace.Member) {
          role = Roles.Stream.Contributor
        }

        // guest can be ignored, they get roles from the original project role
        if (role)
          await grantStreamPermissions({ userId, streamId: sourceProject.id, role })
      }

      // throw new Error('not ready to commit to this just yet')
      await mainTrx.commit()
      await regionTrx.commit()
    } catch (err) {
      await regionTrx.rollback()
      await mainTrx.commit()
      // cleanup the project from the DB
      await deleteProjectFactory({ db: regionDb })({ projectId: sourceProject.id })
      throw err
    }
  }
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.log(e))
