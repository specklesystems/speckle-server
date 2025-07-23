import { getBlobsFactory } from '@/modules/blobstorage/repositories'
import type { CommentRecord } from '@/modules/comments/helpers/types'
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
import { resourceBuilder } from '@speckle/shared/viewer/route'
import cryptoRandomString from 'crypto-random-string'

export const createTestComment = async (
  params: {
    userId: string
    projectId: string
    createdAt?: Date
  } & ({ objectId: string } | { modelId: string; versionId?: string })
): Promise<CommentRecord> => {
  const { userId, projectId } = params

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

  const resourceIdStringBuilder = resourceBuilder()
  if ('objectId' in params) {
    resourceIdStringBuilder.addObject(params.objectId)
  } else {
    resourceIdStringBuilder.addModel(params.modelId, params.versionId)
  }

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
      resourceIdString: resourceIdStringBuilder.toString()
    },
    userId,
    {
      createdAt: params.createdAt
    }
  )
}
