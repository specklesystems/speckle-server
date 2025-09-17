import { db } from '@/db/knex'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { mapServerRoleToValue } from '@/modules/core/helpers/graphTypes'
import { toProjectIdWhitelist } from '@/modules/core/helpers/token'
import { legacyGetStreamsFactory } from '@/modules/core/repositories/streams'
import {
  countUsersFactory,
  listUsersFactory,
  markUserAsVerifiedFactory,
  updateUserEmailVerificationFactory
} from '@/modules/core/repositories/users'
import {
  adminUpdateEmailVerificationFactory,
  adminInviteListFactory,
  adminProjectListFactory,
  adminUserListFactory,
  updateEmailVerificationFactory
} from '@/modules/core/services/admin'
import {
  deleteVerificationsFactory,
  getPendingTokenFactory
} from '@/modules/emails/repositories'
import { finalizeEmailVerificationFactory } from '@/modules/emails/services/verification/finalize'
import {
  countServerInvitesFactory,
  queryServerInvitesFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { asMultiregionalOperation } from '@/modules/shared/command'
import {
  getTotalStreamCountFactory,
  getTotalUserCountFactory
} from '@/modules/stats/repositories'
import { markUserEmailAsVerifiedFactory } from '../../services/users/emailVerification'
import { updateUserEmailFactory } from '../../repositories/userEmails'
import { getAllRegisteredDbs } from '@/modules/multiregion/utils/dbSelector'

const adminUserList = adminUserListFactory({
  listUsers: listUsersFactory({ db }),
  countUsers: countUsersFactory({ db })
})
const adminInviteList = adminInviteListFactory({
  countServerInvites: countServerInvitesFactory({ db }),
  queryServerInvites: queryServerInvitesFactory({ db })
})
const adminProjectList = adminProjectListFactory({
  getStreams: legacyGetStreamsFactory({ db })
})

const updateEmailVerification = updateEmailVerificationFactory({
  updateUserEmailVerification: updateUserEmailVerificationFactory({ db })
})

export default {
  Query: {
    admin: () => ({})
  },
  AdminQueries: {
    async userList(_parent, { limit, cursor, query, role }) {
      return await adminUserList({
        limit,
        cursor,
        query,
        role: role ? mapServerRoleToValue(role) : null
      })
    },
    async projectList(_parent, args, ctx) {
      return await adminProjectList({
        query: args.query ?? null,
        orderBy: args.orderBy ?? null,
        visibility: args.visibility ?? null,
        limit: args.limit,
        cursor: args.cursor,
        streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules)
      })
    },
    serverStatistics: () => ({}),
    async inviteList(_parent, args) {
      return await adminInviteList(args)
    }
  },
  Mutation: {
    admin: () => ({})
  },
  AdminMutations: {
    async updateEmailVerification(_parent, args, ctx) {
      try {
        await asMultiregionalOperation(
          async ({ mainDb, allDbs }) => {
            const finalizeEmailVerification = adminUpdateEmailVerificationFactory({
              deleteVerifications: deleteVerificationsFactory({ db: mainDb }),
              updateUserEmailVerification: updateUserEmailVerificationFactory({
                db: mainDb
              }),
              updateUserEmail: updateUserEmailFactory({ db: mainDb })
            })

            return await finalizeEmailVerification(args.input)
          },
          {
            logger: ctx.log,
            dbs: await getAllRegisteredDbs(),
            name: 'finalizeEmailVerification',
            description: 'Finalize email verification'
          }
        )
      } catch (error) {
        const msg =
          error instanceof EmailVerificationFinalizationError
            ? error.message
            : 'Email verification unexpectedly failed'
        logger.info({ err: error }, 'Email verification failed.')

        return res.redirect(
          new URL(`/?emailverifiederror=${msg}`, getFrontendOrigin()).toString()
        )
      }
      return await updateEmailVerification({
        email: args.input.email,
        verified: args.input.verified
      })
    }
  },
  ServerStatistics: {
    async totalProjectCount() {
      return await getTotalStreamCountFactory({ db })()
    },

    async totalUserCount() {
      return await getTotalUserCountFactory({ db })()
    },
    async totalPendingInvites() {
      return 0
    }
  }
} as Resolvers
