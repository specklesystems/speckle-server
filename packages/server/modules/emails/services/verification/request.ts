import {
  FindEmail,
  FindPrimaryEmailForUser
} from '@/modules/core/domain/userEmails/operations'
import { UserEmail } from '@/modules/core/domain/userEmails/types'
import { ServerInfo, UserRecord } from '@/modules/core/helpers/types'
import { EmailVerificationRequestError } from '@/modules/emails/errors'
import {
  DeleteOldAndInsertNewVerification,
  EmailTemplateParams,
  RenderEmail,
  RequestEmailVerification,
  RequestNewEmailVerification,
  SendEmail
} from '@/modules/emails/domain/operations'
import { GetUser } from '@/modules/core/domain/users/operations'
import { GetServerInfo } from '@/modules/core/domain/server/operations'

const EMAIL_SUBJECT = 'Speckle Account E-mail Verification'

type CreateNewVerificationDeps = {
  getUser: GetUser
  findPrimaryEmailForUser: FindPrimaryEmailForUser
  getServerInfo: GetServerInfo
  deleteOldAndInsertNewVerification: DeleteOldAndInsertNewVerification
}

const createNewVerificationFactory =
  (deps: CreateNewVerificationDeps) =>
  async (userId: string): Promise<VerificationRequestContext> => {
    if (!userId)
      throw new EmailVerificationRequestError('User for verification not specified')

    const [user, email, serverInfo] = await Promise.all([
      deps.getUser(userId),
      deps.findPrimaryEmailForUser({ userId }),
      deps.getServerInfo()
    ])

    if (!user || !email)
      throw new EmailVerificationRequestError(
        'Unable to resolve verification target user'
      )

    if (user.verified)
      throw new EmailVerificationRequestError("User's email is already verified")

    const verificationCode = await deps.deleteOldAndInsertNewVerification(user.email)

    return {
      user,
      email,
      verificationCode,
      serverInfo
    }
  }

type VerificationRequestContext = {
  user: UserRecord
  verificationCode: string
  serverInfo: ServerInfo
  email: UserEmail
}

type CreateNewEmailVerificationFactoryDeps = {
  findEmail: FindEmail
  getUser: GetUser
  getServerInfo: GetServerInfo
  deleteOldAndInsertNewVerification: DeleteOldAndInsertNewVerification
}

const createNewEmailVerificationFactory =
  (deps: CreateNewEmailVerificationFactoryDeps) =>
  async (emailId: string): Promise<VerificationRequestContext> => {
    const emailRecord = await deps.findEmail({ id: emailId })

    if (!emailRecord) throw new EmailVerificationRequestError('Email not found')

    if (emailRecord.verified)
      throw new EmailVerificationRequestError('Email is already verified')

    const [user, serverInfo] = await Promise.all([
      deps.getUser(emailRecord.userId),
      deps.getServerInfo()
    ])

    if (!user)
      throw new EmailVerificationRequestError(
        'Unable to resolve verification target user'
      )

    const verificationCode = await deps.deleteOldAndInsertNewVerification(
      emailRecord.email
    )
    return {
      user,
      email: emailRecord,
      verificationCode,
      serverInfo
    }
  }

function buildMjmlBody(verificationCode: string) {
  const bodyStart = `<mj-text><p style="text-align: center">You have just registered to the Speckle server, or initiated the email verification process manually. To finalize the verification process, use the code below.</p></mj-text>
  <mj-text><strong style="font-size: 32px;text-align: center; display:block;">${verificationCode}</strong></mj-text>
  <mj-text><p style="text-align: center">This code will expire in 5 minutes. Please do not disclose this code to others.</p>
  <p style="text-align: center">If you did not make this request, please disregard this email.</p></mj-text>`
  const bodyEnd = `<mj-text>
    <p style="text-align: center">
    See you soon,<br/>
    Speckle
    </p>
  </mj-text>
  `

  return { bodyStart, bodyEnd }
}

function buildTextBody(verificationCode: string) {
  const bodyStart = `Hello,\n\nYou have just registered to the Speckle server, or initiated the email verification process manually. To finalize the verification process, use the code below:`
  const bodyEnd = `This code expires in 5 minutes:
${verificationCode}
\r\n
If the code does not work, please proceed by logging in to your Speckle account with your e-mail address and password, clicking the Notification icon, selecting "Send Verification" and verifying your e-mail address by new code.\n\nSee you soon,\nSpeckle
  `

  return { bodyStart, bodyEnd }
}

function buildEmailTemplateParams(verificationCode: string): EmailTemplateParams {
  return {
    mjml: buildMjmlBody(verificationCode),
    text: buildTextBody(verificationCode)
  }
}

type SendVerificationEmailDeps = {
  sendEmail: SendEmail
  renderEmail: RenderEmail
}

const sendVerificationEmailFactory =
  (deps: SendVerificationEmailDeps) => async (state: VerificationRequestContext) => {
    const emailTemplateParams = buildEmailTemplateParams(state.verificationCode)
    const { html, text } = await deps.renderEmail(
      emailTemplateParams,
      state.serverInfo,
      // im deliberately setting this to null, so that the email will not show the unsubscribe bit
      null
    )
    await deps.sendEmail({
      to: state.email.email,
      subject: EMAIL_SUBJECT,
      text,
      html
    })
  }

/**
 * Request email verification (send out verification message) for user with specified ID
 */
export const requestEmailVerificationFactory =
  (
    deps: CreateNewVerificationDeps & SendVerificationEmailDeps
  ): RequestEmailVerification =>
  async (userId) => {
    const newVerificationState = await createNewVerificationFactory(deps)(userId)
    await sendVerificationEmailFactory(deps)(newVerificationState)
  }

type RequestNewEmailVerificationDeps = CreateNewEmailVerificationFactoryDeps

/**
 * Request email verification for email with specified ID
 */
export const requestNewEmailVerificationFactory =
  (
    deps: RequestNewEmailVerificationDeps & SendVerificationEmailDeps
  ): RequestNewEmailVerification =>
  async (emailId) => {
    const createNewEmailVerification = createNewEmailVerificationFactory(deps)
    const newVerificationState = await createNewEmailVerification(emailId)

    await sendVerificationEmailFactory(deps)(newVerificationState)
  }
