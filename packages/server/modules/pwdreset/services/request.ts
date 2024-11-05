import { GetServerInfo } from '@/modules/core/domain/server/operations'
import { GetUserByEmail } from '@/modules/core/domain/users/operations'
import { getPasswordResetFinalizationRoute } from '@/modules/core/helpers/routeHelper'
import {
  EmailTemplateParams,
  renderEmail
} from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { CreateToken, GetPendingToken } from '@/modules/pwdreset/domain/operations'
import { InvalidPasswordRecoveryRequestError } from '@/modules/pwdreset/errors'
import { PasswordResetTokenRecord } from '@/modules/pwdreset/repositories'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'

const EMAIL_SUBJECT = 'Speckle Account Password Reset'

type InitializeNewTokenDeps = {
  getUserByEmail: GetUserByEmail
  getPendingToken: GetPendingToken
  createToken: CreateToken
  getServerInfo: GetServerInfo
}

/**
 * Initialize and validate password reset request
 */
const initializeNewTokenFactory =
  (deps: InitializeNewTokenDeps) => async (email: string) => {
    if (!email) throw new InvalidPasswordRecoveryRequestError('E-mail address is empty')

    const [user, tokenAlreadyExists] = await Promise.all([
      deps.getUserByEmail(email),
      deps.getPendingToken({ email }).then((t) => !!t)
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
      deps.getServerInfo(),
      deps.createToken(email)
    ])

    return { user, serverInfo, email, newToken }
  }

type PasswordRecoveryRequestState = Awaited<
  ReturnType<ReturnType<typeof initializeNewTokenFactory>>
>

function buildResetLink(token: PasswordResetTokenRecord) {
  return new URL(
    getPasswordResetFinalizationRoute(token.id),
    getFrontendOrigin()
  ).toString()
}

function buildMjmlBody() {
  const bodyStart = `<mj-text>Hello,<br/><br/>You have just requested a password reset a few moments ago for your Speckle account. Please click on the button below to complete the process:</mj-text>`

  const bodyEnd = `<mj-text>The link above is valid for <strong>1 hour</strong>. If you didn't request a password reset, feel free to ignore this email - nothing will happen, and your account is secure.</mj-text>`

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
): EmailTemplateParams {
  const { newToken } = state

  return {
    mjml: buildMjmlBody(),
    text: buildTextBody(),
    cta: {
      title: 'Reset Your Password',
      url: buildResetLink(newToken)
    }
  }
}

type SendResetEmailDeps = {
  renderEmail: typeof renderEmail
  sendEmail: typeof sendEmail
}

const sendResetEmailFactory =
  (deps: SendResetEmailDeps) => async (state: PasswordRecoveryRequestState) => {
    const emailTemplateParams = buildEmailTemplateParams(state)
    const { html, text } = await deps.renderEmail(
      emailTemplateParams,
      state.serverInfo,
      state.user
    )
    await deps.sendEmail({
      to: state.email,
      subject: EMAIL_SUBJECT,
      text,
      html
    })
  }

/**
 * Request a new password recovery and send out the e-mail if the request is valid
 */
export const requestPasswordRecoveryFactory =
  (deps: InitializeNewTokenDeps & SendResetEmailDeps) => async (email: string) => {
    const state = await initializeNewTokenFactory(deps)(email)
    await sendResetEmailFactory(deps)(state)
  }
