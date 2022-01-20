/* istanbul ignore file */
'use strict'
const debug = require('debug')('speckle')

const nodemailer = require('nodemailer')
const modulesDebug = debug.extend('modules')
const errorDebug = debug.extend('errors')

let transporter

const initTestSmtpTransporter = async () => {
  const account = await nodemailer.createTestAccount()
  return nodemailer.createTransport({
    'host': 'smtp.ethereal.email',
    'port': 587,
    'secure': false,
    'auth': {
      'user': account.user,
      'pass': account.pass,
    },
  })
}

const createJsonEchoTransporter = () => nodemailer.createTransport({
  'jsonTransport': true,
})

const initSmtpTransporter = async () => {
  try {
    const smtpTransporter = nodemailer.createTransport({
      'host': process.env.EMAIL_HOST,
      'port': process.env.EMAIL_PORT || 587,
      'secure': process.env.EMAIL_SECURE === 'true',
      'auth': {
        'user': process.env.EMAIL_USERNAME,
        'pass': process.env.EMAIL_PASSWORD,
      },
    })
    await smtpTransporter.verify()
    return smtpTransporter
  } catch {
    errorDebug('📧 Email provider is misconfigured, check config variables.')
  }
}

const initTransporter = async () => {
  if (process.env.NODE_ENV === 'test') return createJsonEchoTransporter()
  // if (process.env.NODE_ENV === 'test') return await initTestSmtpTransporter()
  if (process.env.EMAIL === 'true') return await initSmtpTransporter()

  modulesDebug(
    `📧 Email provider is not configured. Server functionality will be limited.`,
  )
}

exports.init = async (app, __) => {
  modulesDebug('📧 Init emails module')
  transporter = await initTransporter()
  require( './rest' )( app )
}

exports.finalize = async () => {
  // Nothing to do here.
}

exports.sendEmail = async ({ from, to, subject, text, html }) => {
  // if the transport takes a while to resolve, it is possible to
  // trigger a false error
  if (!transporter) {
    errorDebug('No email transport present. Cannot send emails.')
  }
  try {
    const emailFrom = process.env.EMAIL_FROM || 'no-reply@speckle.systems'
    return await transporter.sendMail({
      'from': from || `"Speckle" <${emailFrom}>`,
      to,
      subject,
      text,
      html,
    })
  } catch (error) {
    errorDebug(error)
  }
}
