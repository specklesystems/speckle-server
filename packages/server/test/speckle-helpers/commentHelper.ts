import { getBlobsFactory } from '@/modules/blobstorage/repositories'
import { CommentRecord } from '@/modules/comments/helpers/types'
import {
  insertCommentLinksFactory,
  insertCommentsFactory,
  markCommentViewedFactory
} from '@/modules/comments/repositories/comments'
import { validateInputAttachmentsFactory } from '@/modules/comments/services/commentTextService'
import { createCommentThreadAndNotifyFactory } from '@/modules/comments/services/management'
import {
  getBranchLatestCommitsFactory,
  getStreamBranchesByNameFactory
} from '@/modules/core/repositories/branches'
import {
  getAllBranchCommitsFactory,
  getSpecificBranchCommitsFactory
} from '@/modules/core/repositories/commits'
import { getStreamObjectsFactory } from '@/modules/core/repositories/objects'
import {
  getViewerResourceGroupsFactory,
  getViewerResourceItemsUngroupedFactory
} from '@/modules/core/services/commit/viewerResources'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import cryptoRandomString from 'crypto-random-string'

export const createTestComment = async (params: {
  userId: string
  projectId: string
  objectId: string
}): Promise<CommentRecord> => {
  const { userId, projectId, objectId } = params

  const projectDb = await getProjectDbClient({ projectId })

  const createComment = createCommentThreadAndNotifyFactory({
    getViewerResourceItemsUngrouped: getViewerResourceItemsUngroupedFactory({
      getViewerResourceGroups: getViewerResourceGroupsFactory({
        getStreamObjects: getStreamObjectsFactory({ db: projectDb }),
        getBranchLatestCommits: getBranchLatestCommitsFactory({ db: projectDb }),
        getStreamBranchesByName: getStreamBranchesByNameFactory({ db: projectDb }),
        getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db: projectDb }),
        getAllBranchCommits: getAllBranchCommitsFactory({ db: projectDb })
      })
    }),
    validateInputAttachments: validateInputAttachmentsFactory({
      getBlobs: getBlobsFactory({ db: projectDb })
    }),
    insertComments: insertCommentsFactory({ db: projectDb }),
    insertCommentLinks: insertCommentLinksFactory({ db: projectDb }),
    markCommentViewed: markCommentViewedFactory({ db: projectDb }),
    emitEvent: async () => {}
  })

  return await createComment(
    {
      content: {
        doc: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: cryptoRandomString({ length: 9 })
                }
              ]
            }
          ]
        }
      },
      projectId,
      resourceIdString: objectId
    },
    userId
  )
}
