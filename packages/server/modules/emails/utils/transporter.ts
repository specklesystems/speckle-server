import debug from 'debug'

import { createTransport, Transporter } from 'nodemailer'

const modulesDebug = debug('speckle').extend('modules')
const errorDebug = debug('speckle').extend('errors')

let transporter: Transporter | undefined = undefined

const createJsonEchoTransporter = () => createTransport({ jsonTransport: true })

const initSmtpTransporter = async () => {
  try {
    const smtpTransporter = createTransport({
      host: process.env.EMAIL_HOST || 'localhost',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      },
      pool: true,
      maxConnections: 20,
      maxMessages: Infinity
    })
    await smtpTransporter.verify()
    return smtpTransporter
  } catch (e) {
    errorDebug('📧 Email provider is misconfigured, check config variables.', e)
  }
}

export async function initializeTransporter(): Promise<Transporter | undefined> {
  let newTransporter = undefined

  if (process.env.NODE_ENV === 'test') newTransporter = createJsonEchoTransporter()
  if (process.env.EMAIL === 'true') newTransporter = await initSmtpTransporter()

  if (!newTransporter) {
    modulesDebug(
      '📧 Email provider is not configured. Server functionality will be limited.'
    )
  }

  transporter = newTransporter
  return newTransporter
}

export function getTransporter(): Transporter | undefined {
  return transporter
}
