import {
  PaginatedCommitCommentsParams,
  getPaginatedCommitComments as getPaginatedCommitCommentsDb,
  getPaginatedCommitCommentsTotalCount,
  PaginatedBranchCommentsParams,
  getPaginatedBranchComments as getPaginatedBranchCommentsDb,
  getPaginatedBranchCommentsTotalCount
} from '@/modules/comments/repositories/comments'

export async function getPaginatedCommitComments(
  params: PaginatedCommitCommentsParams
) {
  const [result, totalCount] = await Promise.all([
    getPaginatedCommitCommentsDb(params),
    getPaginatedCommitCommentsTotalCount(params)
  ])

  return {
    ...result,
    totalCount
  }
}

export async function getPaginatedBranchComments(
  params: PaginatedBranchCommentsParams
) {
  const [result, totalCount] = await Promise.all([
    getPaginatedBranchCommentsDb(params),
    getPaginatedBranchCommentsTotalCount(params)
  ])

  return {
    ...result,
    totalCount
  }
}
