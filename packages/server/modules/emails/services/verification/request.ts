import {
  FindEmail,
  FindPrimaryEmailForUser
} from '@/modules/core/domain/userEmails/operations'
import { UserEmail } from '@/modules/core/domain/userEmails/types'
import { getEmailVerificationFinalizationRoute } from '@/modules/core/helpers/routeHelper'
import { ServerInfo, UserRecord } from '@/modules/core/helpers/types'
import { EmailVerificationRequestError } from '@/modules/emails/errors'
import {
  EmailTemplateParams,
  renderEmail
} from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import {
  DeleteOldAndInsertNewVerification,
  RequestEmailVerification,
  RequestNewEmailVerification
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

    const verificationId = await deps.deleteOldAndInsertNewVerification(user.email)

    return {
      user,
      email,
      verificationId,
      serverInfo
    }
  }

type VerificationRequestContext = {
  user: UserRecord
  verificationId: string
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

    const verificationId = await deps.deleteOldAndInsertNewVerification(
      emailRecord.email
    )
    return {
      user,
      email: emailRecord,
      verificationId,
      serverInfo
    }
  }

function buildMjmlBody() {
  const bodyStart = `<mj-text>Hello,<br/><br/>You have just registered to the Speckle server, or initiated the email verification process manually. To finalize the verification process, click the button below:</mj-text>`
  const bodyEnd = `<mj-text>This link expires in <strong>1 week</strong>.<br/>
  If the link does not work, please proceed by</mj-text><br/>
  <mj-list>
    <mj-li>Logging in with your e-mail address and password</mj-li>
    <mj-li>Clicking on the Notification icon</mj-li>
    <mj-li>Selecting "Send Verification"</mj-li>
    <mj-li>Verifying your e-mail address by clicking on the link in the e-mail you will receive</mj-li>
  </mj-list><br/>
  <mj-text>
    See you soon,<br/>
    Speckle
  </mj-text>
  `

  return { bodyStart, bodyEnd }
}

function buildTextBody() {
  const bodyStart = `Hello,\n\nYou have just registered to the Speckle server, or initiated the email verification process manually. To finalize the verification process, open the link below:`
  const bodyEnd = `This link expires in 1 week. If the link does not work, please proceed by logging in to your Speckle account with your e-mail address and password, clicking the Notification icon, selecting "Send Verification" and verifying your e-mail address by clicking on the link in the e-mail you will receive.\n\nSee you soon,\nSpeckle
  `

  return { bodyStart, bodyEnd }
}

function buildEmailLink(verificationId: string): string {
  return new URL(
    getEmailVerificationFinalizationRoute(verificationId),
    getServerOrigin()
  ).toString()
}

function buildEmailTemplateParams(verificationId: string): EmailTemplateParams {
  return {
    mjml: buildMjmlBody(),
    text: buildTextBody(),
    cta: {
      title: 'Verify your E-mail',
      url: buildEmailLink(verificationId)
    }
  }
}

type SendVerificationEmailDeps = {
  sendEmail: typeof sendEmail
  renderEmail: typeof renderEmail
}

const sendVerificationEmailFactory =
  (deps: SendVerificationEmailDeps) => async (state: VerificationRequestContext) => {
    const emailTemplateParams = buildEmailTemplateParams(state.verificationId)
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
