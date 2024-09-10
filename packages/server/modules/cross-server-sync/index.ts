import { moduleLogger, crossServerSyncLogger } from '@/logging/logging'
import {
  createCommentReplyAndNotify,
  createCommentThreadAndNotify
} from '@/modules/comments/services/management'
import { getStreamBranchByName } from '@/modules/core/repositories/branches'
import { getObject } from '@/modules/core/repositories/objects'
import {
  getOnboardingBaseStream,
  getStream,
  getStreamCollaborators,
  markOnboardingBaseStream
} from '@/modules/core/repositories/streams'
import { getFirstAdmin, getUser } from '@/modules/core/repositories/users'
import { createBranchAndNotify } from '@/modules/core/services/branch/management'
import { createCommitByBranchId } from '@/modules/core/services/commit/management'
import { createObject } from '@/modules/core/services/objects'
import { createStreamReturnRecord } from '@/modules/core/services/streams/management'
import { downloadCommitFactory } from '@/modules/cross-server-sync/services/commit'
import { ensureOnboardingProjectFactory } from '@/modules/cross-server-sync/services/onboardingProject'
import { downloadProjectFactory } from '@/modules/cross-server-sync/services/project'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

const crossServerSyncModule: SpeckleModule = {
  init() {
    moduleLogger.info('🔄️ Init cross-server-sync module')
  },
  finalize() {
    crossServerSyncLogger.info('⬇️  Ensuring base onboarding stream asynchronously...')
    const ensureOnboardingProject = ensureOnboardingProjectFactory({
      getOnboardingBaseStream,
      getFirstAdmin,
      downloadProject: downloadProjectFactory({
        downloadCommit: downloadCommitFactory({
          getStream,
          getStreamBranchByName,
          getStreamCollaborators,
          getUser,
          createCommitByBranchId,
          createObject,
          getObject,
          createCommentThreadAndNotify,
          createCommentReplyAndNotify
        }),
        createStreamReturnRecord,
        getUser,
        getStreamBranchByName,
        createBranchAndNotify
      }),
      markOnboardingBaseStream
    })

    void ensureOnboardingProject().catch((err) =>
      crossServerSyncLogger.error(err, 'Error ensuring onboarding stream')
    )
  }
}

export = crossServerSyncModule
