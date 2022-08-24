import { InvalidArgumentError } from '@/modules/shared/errors'
import { MaybeNullOrUndefined } from '@/modules/shared/helpers/typeHelper'

/**
 * Collection of functions for resolving relative routes from the backend, so that they aren't duplicated
 * all over the place
 */

export function getStreamRoute(streamId: string): string {
  return `/streams/${streamId}`
}

export function getRegistrationRoute(): string {
  return `/authn/register`
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
