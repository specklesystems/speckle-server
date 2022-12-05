/* istanbul ignore file */
import * as SendingService from '@/modules/emails/services/sending'
import { initializeVerificationOnRegistration } from '@/modules/emails/services/verification/request'
import { initializeTransporter } from '@/modules/emails/utils/transporter'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import dbg from 'debug'

const debug = dbg('speckle')
const modulesDebug = debug.extend('modules')
let quitVerificationListeners: Optional<() => void> = undefined

const emailsModule: SpeckleModule = {
  init: async (app, isInitial) => {
    modulesDebug('📧 Init emails module')

    // init transporter
    await initializeTransporter()

    // init rest api
    ;(await import('./rest')).default(app)

    // init event listeners
    if (isInitial) {
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
