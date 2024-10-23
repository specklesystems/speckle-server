/* istanbul ignore file */
import { db } from '@/db/knex'
import { moduleLogger } from '@/logging/logging'
import { UsersEmitter } from '@/modules/core/events/usersEmitter'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { findPrimaryEmailForUserFactory } from '@/modules/core/repositories/userEmails'
import { getUserFactory } from '@/modules/core/repositories/users'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import * as SendingService from '@/modules/emails/services/sending'
import {
  initializeVerificationOnRegistrationFactory,
  requestEmailVerificationFactory
} from '@/modules/emails/services/verification/request'
import { initializeTransporter } from '@/modules/emails/utils/transporter'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'

let quitVerificationListeners: Optional<() => void> = undefined

const emailsModule: SpeckleModule = {
  init: async (app, isInitial) => {
    moduleLogger.info('📧 Init emails module')

    // init transporter
    await initializeTransporter()

    // init rest api
    ;(await import('./rest')).default(app)

    // init event listeners
    if (isInitial) {
      const getUser = getUserFactory({ db })
      const initializeVerificationOnRegistration =
        initializeVerificationOnRegistrationFactory({
          userEmitterListener: UsersEmitter.listen,
          requestEmailVerification: requestEmailVerificationFactory({
            getUser,
            getServerInfo: getServerInfoFactory({ db }),
            deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory(
              { db }
            ),
            findPrimaryEmailForUser: findPrimaryEmailForUserFactory({ db }),
            sendEmail: SendingService.sendEmail,
            renderEmail
          })
        })

      quitVerificationListeners = initializeVerificationOnRegistration()
    }
  },

  shutdown() {
    quitVerificationListeners?.()
  }
}

async function sendEmail({
  from,
  to,
  subject,
  text,
  html
}: {
  from?: string
  to: string
  subject: string
  text: string
  html: string
}) {
  return SendingService.sendEmail({ from, to, subject, text, html })
}

export = {
  ...emailsModule,
  sendEmail
}
