import { UsersEmitter, UsersEvents } from '@/modules/core/events/usersEmitter'
import { getEmailVerificationFinalizationRoute } from '@/modules/core/helpers/routeHelper'
import { getUser } from '@/modules/core/repositories/users'
import { getServerInfo } from '@/modules/core/services/generic'
import { EmailVerificationRequestError } from '@/modules/emails/errors'
import { deleteOldAndInsertNewVerification } from '@/modules/emails/repositories'
import {
  EmailTemplateParams,
  renderEmail
} from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'

const EMAIL_SUBJECT = 'Speckle Account E-mail Verification'

async function createNewVerification(userId: string) {
  if (!userId)
    throw new EmailVerificationRequestError('User for verification not specified')

  const [user, serverInfo] = await Promise.all([getUser(userId), getServerInfo()])

  if (!user)
    throw new EmailVerificationRequestError(
      'Unable to resolve verification target user'
    )

  if (user.verified)
    throw new EmailVerificationRequestError("User's email is already verified")

  const verificationId = await deleteOldAndInsertNewVerification(user.email)

  return {
    user,
    verificationId,
    serverInfo
  }
}

type NewEmailVerificationState = Awaited<ReturnType<typeof createNewVerification>>

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

function buildEmailLink(state: NewEmailVerificationState): string {
  return new URL(
    getEmailVerificationFinalizationRoute(state.verificationId),
    getServerOrigin()
  ).toString()
}

function buildEmailTemplateParams(
  state: NewEmailVerificationState
): EmailTemplateParams {
  return {
    mjml: buildMjmlBody(),
    text: buildTextBody(),
    cta: {
      title: 'Verify your E-mail',
      url: buildEmailLink(state)
    }
  }
}

async function sendVerificationEmail(state: NewEmailVerificationState) {
  const emailTemplateParams = buildEmailTemplateParams(state)
  const { html, text } = await renderEmail(
    emailTemplateParams,
    state.serverInfo,
    state.user
  )
  await sendEmail({
    to: state.user.email,
    subject: EMAIL_SUBJECT,
    text,
    html
  })
}

/**
 * Request email verification (send out verification message) for user with specified ID
 */
export async function requestEmailVerification(userId: string) {
  const newVerificationState = await createNewVerification(userId)
  await sendVerificationEmail(newVerificationState)
}

/**
 * Listen for user:created events and trigger email verification initialization
 */
export function initializeVerificationOnRegistration() {
  return UsersEmitter.listen(UsersEvents.Created, async ({ user }) => {
    // user might already be verified because of registration through an external identity provider
    if (user.verified) return

    await requestEmailVerification(user.id)
  })
}
