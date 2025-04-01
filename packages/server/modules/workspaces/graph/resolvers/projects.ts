import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { getPaginatedItemsFactory } from '@/modules/shared/services/paginatedItems'
import { WorkspaceTeamMember } from '@/modules/workspaces/domain/types'
import {
  countInvitableCollaboratorsByProjectIdFactory,
  getInvitableCollaboratorsByProjectIdFactory
} from '@/modules/workspaces/repositories/users'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

export default FF_WORKSPACES_MODULE_ENABLED
  ? ({
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
        }
      }
    } as Resolvers)
  : {}
