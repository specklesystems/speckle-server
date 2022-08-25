import { getUserByEmail } from '@/modules/core/repositories/users'
import { getServerInfo } from '@/modules/core/services/generic'
import { sendEmail } from '@/modules/emails/services/sending'
import {
  BasicEmailTemplateParams,
  buildBasicTemplateEmail,
  buildBasicTemplateServerInfo
} from '@/modules/emails/services/templateFormatting'
import { InvalidPasswordRecoveryRequestError } from '@/modules/pwdreset/errors'
import {
  createToken,
  getPendingToken,
  PasswordResetTokenRecord
} from '@/modules/pwdreset/repositories'
import { getBaseUrl } from '@/modules/shared/helpers/envHelper'

const EMAIL_SUBJECT = 'Speckle Account Password Reset'

/**
 * Initialize and validate password reset request
 */
async function initializeNewToken(email: string) {
  if (!email) throw new InvalidPasswordRecoveryRequestError('E-mail address is empty')

  const [user, tokenAlreadyExists] = await Promise.all([
    getUserByEmail(email),
    getPendingToken({ email }).then((t) => !!t)
  ])

  if (!user) {
    throw new InvalidPasswordRecoveryRequestError(
      'No user with that e-mail address found'
    )
  }

  if (tokenAlreadyExists) {
    throw new InvalidPasswordRecoveryRequestError(
      'Password reset already requested. Please try again in 1h, or check your email for the instructions we have sent.'
    )
  }

  const [serverInfo, newToken] = await Promise.all([
    getServerInfo(),
    createToken(email)
  ])

  return { user, serverInfo, email, newToken }
}

type PasswordRecoveryRequestState = Awaited<ReturnType<typeof initializeNewToken>>

function buildResetLink(token: PasswordResetTokenRecord) {
  return new URL(`/authn/resetpassword/finalize?t=${token.id}`, getBaseUrl()).toString()
}

function buildHtmlBody() {
  const bodyStart = `Hello,<br/><br/>You have just requested a password reset a few moments ago for your Speckle account. Please click on the button below to complete the process:`

  const bodyEnd = `The link above is valid for <strong>1 hour</strong>. If you didn't request a password reset, feel free to ignore this email - nothing will happen, and your account is secure.`

  return {
    bodyStart,
    bodyEnd
  }
}

function buildTextBody() {
  const bodyStart = `Hello,\n\nYou have just requested a password reset a few moments ago for your Speckle account. Please use the link below to complete the process:`
  const bodyEnd = `The link above is valid for 1 hour. If you didn't request a password reset, feel free to ignore this email - nothing will happen, and your account is secure.`

  return {
    bodyStart,
    bodyEnd
  }
}

function buildEmailTemplateParams(
  state: PasswordRecoveryRequestState
): BasicEmailTemplateParams {
  const { serverInfo, newToken } = state

  return {
    html: buildHtmlBody(),
    text: buildTextBody(),
    cta: {
      title: 'Reset Your Password',
      url: buildResetLink(newToken)
    },
    server: buildBasicTemplateServerInfo(serverInfo)
  }
}

async function sendResetEmail(state: PasswordRecoveryRequestState) {
  const emailTemplateParams = buildEmailTemplateParams(state)
  const { html, text } = await buildBasicTemplateEmail(emailTemplateParams)
  await sendEmail({
    to: state.email,
    subject: EMAIL_SUBJECT,
    text,
    html
  })
}

/**
 * Request a new password recovery and send out the e-mail if the request is valid
 */
export async function requestPasswordRecovery(email: string) {
  const state = await initializeNewToken(email)
  await sendResetEmail(state)
}
