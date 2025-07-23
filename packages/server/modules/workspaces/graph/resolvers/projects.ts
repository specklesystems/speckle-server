import { db } from '@/db/knex'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { getPaginatedItemsFactory } from '@/modules/shared/services/paginatedItems'
import type { WorkspaceTeamMember } from '@/modules/workspaces/domain/types'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { intersectProjectCollaboratorsAndWorkspaceCollaboratorsFactory } from '@/modules/workspaces/repositories/projects'
import {
  countInvitableCollaboratorsByProjectIdFactory,
  getInvitableCollaboratorsByProjectIdFactory
} from '@/modules/workspaces/repositories/users'
import { getWorkspaceFactory } from '@/modules/workspaces/repositories/workspaces'
import { getMoveProjectToWorkspaceDryRunFactory } from '@/modules/workspaces/services/projects'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

const resolvers: Resolvers = FF_WORKSPACES_MODULE_ENABLED
  ? {
      Project: {
        invitableCollaborators: async (parent, args) => {
          // TODO: add authz policy
          if (!parent.workspaceId) {
            return {
              totalCount: 0,
              items: [],
              cursor: null
            }
          }

          return await getPaginatedItemsFactory<
            {
              limit: number
              cursor?: string
              filter: {
                workspaceId: string
                projectId: string
                search?: string
              }
            },
            WorkspaceTeamMember
          >({
            getItems: getInvitableCollaboratorsByProjectIdFactory({ db }),
            getTotalCount: countInvitableCollaboratorsByProjectIdFactory({ db })
          })({
            filter: {
              workspaceId: parent.workspaceId,
              projectId: parent.id,
              search: args.filter?.search ?? undefined
            },
            cursor: args.cursor ?? undefined,
            limit: args.limit
          })
        },
        moveToWorkspaceDryRun: async (parent, args) => {
          const { id: projectId } = parent
          const { workspaceId } = args

          const { addedToWorkspace } = await getMoveProjectToWorkspaceDryRunFactory({
            intersectProjectCollaboratorsAndWorkspaceCollaborators:
              intersectProjectCollaboratorsAndWorkspaceCollaboratorsFactory({ db })
          })({ projectId, workspaceId })

          return addedToWorkspace
        },
        embedOptions: async (parent) => {
          const { workspaceId } = parent

          if (!workspaceId) {
            return {
              hideSpeckleBranding: false
            }
          }

          const workspace = await getWorkspaceFactory({ db })({ workspaceId })

          return {
            hideSpeckleBranding: workspace?.isEmbedSpeckleBrandingHidden ?? false
          }
        }
      },
      ProjectMoveToWorkspaceDryRun: {
        addedToWorkspace: async (parent, args) => {
          return args.limit ? parent.slice(0, args.limit) : parent
        },
        addedToWorkspaceTotalCount: async (parent) => {
          return parent.length
        }
      },
      PendingStreamCollaborator: {
        workspaceSlug: async (parent, _args, ctx) => {
          const project = await ctx.loaders.streams.getStream.load(parent.streamId)
          if (!project) {
            throw new StreamNotFoundError(null, {
              info: { projectId: parent.streamId }
            })
          }
          if (!project.workspaceId) {
            return null
          }
          const workspace = await ctx.loaders.workspaces?.getWorkspace.load(
            project.workspaceId
          )
          if (!workspace) {
            throw new WorkspaceNotFoundError(null, {
              info: { workspaceId: project.workspaceId }
            })
          }
          return workspace.slug
        }
      }
    }
  : {}

export default resolvers
