import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

/**
 * Based on Wordpress filters: https://developer.wordpress.org/plugins/hooks/filters/
 * A module defines a filter type, and other modules can register their own filters on top of that,
 * kind of like middlewares.
 *
 * The filter defining module can then invoke the filter, without even knowing what kind of filters
 * were registered by other modules (e.g. workspaces or streams)
 *
 * Wordpress gets away with just having Actions (Events w/o a return type) and Filters (Middlewares w/ return type),
 * maybe that's all we need too? Gergo & Chuck are already working on a global EventBus implementation,
 * the filters could be the other part of the equation.
 */

export type SharedAppApi = {
  addFilterMiddleware: (
    filter: string,
    middleware: (data: unknown, next: () => void) => unknown
  ) => void
  invokeFilter: (filter: string, data: unknown) => unknown
}

// Each speckle module (even coming from NPM package)
// can augment this type to add its own filters
// serverInvites.ts:
declare module '@speckle/server/api' {
  interface SharedAppApi {
    addFilterMiddleware: (
      filter: 'inviteTargetBuilder',
      middleware: (invite: Invite, currentTargets: InviteTarget[]) => InviteTarget[]
    ) => void
    invokeFilter: (
      filter: 'inviteTargetBuilder',
      invite: Invite,
      currentTargets: InviteTarget[]
    ) => InviteTarget[]
  }
}

// workspaces.ts - adds filter that can handle workspaces logic
const fooModule: SpeckleModule = {
  async init(app, isInitial, sharedApi) {
    sharedApi.addFilterMiddleware('inviteTargetBuilder', (invite, currentTargets) => {
      if (invite.type === 'workspace') {
        const workspace = findWorkspaceById(invite.targetId)
        return [...currentTargets, ...buildWorkspaceTargets(workspace)]
      }

      return currentTargets
    })
  }
}

/**
 * IMAGINE THIS IS THE SERVERINVITES RESOLVER
 */

const serverInviteCreate = async (_parent, args, ctx) => {
  const createAndSendInvite = createAndSendInviteFactory({
    findUserByTarget: findUserByTargetFactory(),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    /**
     * We pass in the invokeFilter method
     */
    invokeFilter: ctx.sharedApi.invokeFilter,
    /**
     * OR abstract that away like so:
     */
    buildTargets: (invite) => {
      return ctx.sharedApi.invokeFilter('inviteTargetBuilder', invite)
    }
  })
}

/**
 * IMAGINE THIS IS serverinvites/services/inviteCreationService.ts
 */

export const createAndSendInviteFactory = (deps) => (params) => {
  /**
   * Approach 2: The service doesn't know about what kind of filters are attached, it
   * just invokes it and gets back the result built by workspaces, streams and other future modules
   */
  const resourceTargets: ResourceTargets[] = deps.invokeFilter(
    'inviteTargetBuilder',
    params.invite
  )
}
