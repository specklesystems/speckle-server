import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

export type SharedAppApi = {}

// Each speckle module (even coming from NPM package)
// can augment this type to add the new API it offers
declare module '@speckle/server/api' {
  interface SharedAppApi {
    newFunc: (a: number) => void
    findWorkspaceById: (id: string) => Workspace
  }
}

// Each module sets up this API in its init() function
// With this kind of approach I find the `domain` folder to make more sense, as it essentially could
// describe the "shared API" of the module, accessible by other modules
const fooModule: SpeckleModule = {
  async init(app, isInitial, sharedApi) {
    sharedApi.newFunc = (a: number) => {
      // ...
    }
    sharedApi.findWorkspaceById = (id: string) => {
      // ...
    }
  }
}

/**
 * IMAGINE THIS IS THE SERVERINVITES RESOLVER
 * Note that there's no JS Imports from fooModule - they're fully decoupled - and yet
 * they can still interact with each other through the shared API
 *
 * The global EventBus implementation we're working on could also be injected the same way,
 * to avoid having to import it: ctx.eventBus
 */

const serverInviteCreate = async (_parent, args, ctx) => {
  const createAndSendInvite = createAndSendInviteFactory({
    findResource: findResourceFactory(),
    findUserByTarget: findUserByTargetFactory(),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    // Shared API is attached to ctx OR it could be a global singleton, since it is essentially
    // the same object for the entire runtime for the server
    findWorkspaceById: ctx.sharedApi.findWorkspaceById
  })
}

/**
 * IMAGINE THIS IS serverinvites/services/inviteCreationService.ts
 */

export const createAndSendInviteFactory = (deps) => (params) => {
  /**
   * Approach 1: The service does explicitly work with workspaces logic, but
   * its not coupled to the module, cause its injected through deps
   *
   * I don't think its possible to avoid one of them having to "know"
   * about the logic of another. Either ServerInvites has to know about Workspaces logic,
   * or Workspaces has to know about ServerInvites logic. I don't think thats a problem,
   * as long as the code is decoupled.
   */
  if (isWorkspaceInvite) {
    const worksace = deps.findWorkspaceById(params.workspaceId)
    await validateWorkspaceInvite(params, workspace)
  }
}
