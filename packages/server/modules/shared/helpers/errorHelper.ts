import { AccModuleDisabledError } from '@/modules/acc/errors/acc'
import { AutomateModuleDisabledError } from '@/modules/core/errors/automate'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { WorkspacesModuleDisabledError } from '@/modules/core/errors/workspaces'
import type { BaseError } from '@/modules/shared/errors'
import { BadRequestError, ForbiddenError, NotFoundError } from '@/modules/shared/errors'
import { SsoSessionMissingOrExpiredError } from '@/modules/workspacesCore/errors'
import { Authz, ensureError, throwUncoveredError } from '@speckle/shared'
import VError from 'verror'

/**
 * Resolve cause correctly depending on whether its a VError or basic Error
 * object
 */
export function getCause(e: Error) {
  if (e instanceof VError) {
    return VError.cause(e)
  } else {
    const unknownCause = e.cause
    return unknownCause ? ensureError(e.cause) : null
  }
}

export { ensureError }

/**
 * Global mapping for mapping any kind of auth error to a server thrown error
 */
export const mapAuthToServerError = (e: Authz.AllAuthErrors): BaseError => {
  switch (e.code) {
    case Authz.ProjectNotFoundError.code:
      return new StreamNotFoundError(e.message)
    case Authz.ProjectNoAccessError.code:
    case Authz.WorkspaceNoAccessError.code:
    case Authz.WorkspaceNotEnoughPermissionsError.code:
    case Authz.WorkspaceReadOnlyError.code:
    case Authz.WorkspaceLimitsReachedError.code:
    case Authz.WorkspaceNoEditorSeatError.code:
    case Authz.WorkspaceProjectMoveInvalidError.code:
    case Authz.CommentNoAccessError.code:
    case Authz.ProjectNotEnoughPermissionsError.code:
    case Authz.WorkspacePlanNoFeatureAccessError.code:
    case Authz.EligibleForExclusiveWorkspaceError.code:
    case Authz.AutomateFunctionNotCreatorError.code:
      return new ForbiddenError(e.message)
    case Authz.WorkspaceSsoSessionNoAccessError.code:
      throw new SsoSessionMissingOrExpiredError(e.message, {
        info: {
          workspaceSlug: e.payload.workspaceSlug
        }
      })
    case Authz.ServerNoAccessError.code:
    case Authz.ServerNoSessionError.code:
    case Authz.ServerNotEnoughPermissionsError.code:
      return new ForbiddenError(e.message)
    case Authz.WorkspacesNotEnabledError.code:
      return new WorkspacesModuleDisabledError()
    case Authz.AutomateNotEnabledError.code:
      return new AutomateModuleDisabledError()
    case Authz.AccIntegrationNotEnabledError.code:
      return new AccModuleDisabledError()
    case Authz.ProjectLastOwnerError.code:
    case Authz.ReservedModelNotDeletableError.code:
      return new BadRequestError(e.message)
    case Authz.CommentNotFoundError.code:
    case Authz.ModelNotFoundError.code:
    case Authz.VersionNotFoundError.code:
    case Authz.AutomateFunctionNotFoundError.code:
      return new NotFoundError(e.message)
    case Authz.PersonalProjectsLimitedError.code:
      return new BadRequestError(e.message)
    default:
      throwUncoveredError(e)
  }
}

export const throwIfAuthNotOk = (result: Authz.AuthPolicyResult) => {
  if (result.isOk) return
  throw mapAuthToServerError(result.error)
}
