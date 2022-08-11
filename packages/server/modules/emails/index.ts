/* istanbul ignore file */
import * as SendingService from '@/modules/emails/services/sending'
import { initializeTransporter } from '@/modules/emails/utils/transporter'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import dbg from 'debug'
import { noop } from 'lodash'

const debug = dbg('speckle')
const modulesDebug = debug.extend('modules')

const emailsModule: SpeckleModule = {
  init: async (app) => {
    modulesDebug('📧 Init emails module')

    // init transporter
    await initializeTransporter()

    // init rest api
    ;(await import('./rest')).default(app)
  },

  finalize: noop
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
