import {
  PaginatedCommitCommentsParams,
  getPaginatedCommitComments as getPaginatedCommitCommentsDb,
  getPaginatedCommitCommentsTotalCount,
  PaginatedBranchCommentsParams,
  getPaginatedBranchComments as getPaginatedBranchCommentsDb,
  getPaginatedBranchCommentsTotalCount,
  getPaginatedProjectComments as getPaginatedProjectCommentsDb,
  getPaginatedProjectCommentsTotalCount,
  PaginatedProjectCommentsParams
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

export async function getPaginatedProjectComments(
  params: PaginatedProjectCommentsParams
) {
  const [result, totalCount] = await Promise.all([
    getPaginatedProjectCommentsDb(params),
    getPaginatedProjectCommentsTotalCount(params)
  ])

  return {
    ...result,
    totalCount
  }
}
