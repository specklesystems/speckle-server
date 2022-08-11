const debug = require('debug')('speckle')

const nodemailer = require('nodemailer')
const modulesDebug = debug.extend('modules')
const errorDebug = debug.extend('errors')

/** @type {import('nodemailer').Transporter | undefined} */
let transporter = undefined

const createJsonEchoTransporter = () =>
  nodemailer.createTransport({
    jsonTransport: true
  })

const initSmtpTransporter = async () => {
  try {
    const smtpTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    })
    await smtpTransporter.verify()
    return smtpTransporter
  } catch {
    errorDebug('📧 Email provider is misconfigured, check config variables.')
  }
}

/**
 * @returns {import('nodemailer').Transporter | undefined}
 */
async function initializeTransporter() {
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

/**
 * @returns {import('nodemailer').Transporter | undefined}
 */
function getTransporter() {
  return transporter
}

module.exports = {
  initializeTransporter,
  getTransporter
}
