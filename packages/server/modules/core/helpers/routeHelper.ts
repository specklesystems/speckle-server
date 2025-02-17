import { InvalidArgumentError } from '@/modules/shared/errors'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { MaybeNullOrUndefined } from '@/modules/shared/helpers/typeHelper'

/**
 * Collection of functions for resolving relative routes from the backend, so that they aren't duplicated
 * all over the place
 */

export function getWorkspaceRoute(workspaceSlug: string): string {
  if (!useNewFrontend()) {
    // TODO: This should throw, but tests run in FE1 mode, and if we switch FE2 mode on, a bunch of old auth tests fail
    return '/'
    // throw new LogicError('Workspaces are not supported in the old frontend')
  }

  return `/workspaces/${workspaceSlug}`
}

export function getStreamRoute(streamId: string): string {
  return `/projects/${streamId}`
}

export function getRegistrationRoute(): string {
  return '/authn/register'
}

export function getCommentRoute(
  streamId: string,
  commentId: string,
  objectOrCommit: {
    commitId?: MaybeNullOrUndefined<string>
    objectId?: MaybeNullOrUndefined<string>
  }
) {
  const { commitId, objectId } = objectOrCommit
  if (!commitId && !objectId) {
    throw new InvalidArgumentError('Either object or commit ID must be specified!')
  }

  const objectOrCommitPart = commitId ? `commits/${commitId}` : `objects/${objectId}`
  return `/streams/${streamId}/${objectOrCommitPart}?cId=${commentId}`
}

export function getPasswordResetFinalizationRoute(tokenId: string): string {
  return `/authn/reset-password?token=${tokenId}`
}

export function getEmailVerificationFinalizationRoute(tokenId: string): string {
  return `/auth/verifyemail?t=${tokenId}`
}

export function getStreamCollaboratorsRoute(streamId: string): string {
  return `${getStreamRoute(streamId)}/collaborators`
}

export function buildAbsoluteFrontendUrlFromPath(route: string): string {
  return new URL(route, getFrontendOrigin()).toString()
}

export function getFunctionsMarketplaceUrl(workspaceSlug?: string) {
  const path = workspaceSlug ? `/workspaces/${workspaceSlug}/functions` : '/functions'
  return new URL(path, getFrontendOrigin())
}
