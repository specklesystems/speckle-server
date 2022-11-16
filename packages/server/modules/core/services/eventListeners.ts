import { UsersEmitter, UsersEvents } from '@/modules/core/events/usersEmitter'
import { ServerInfo, UserRecord } from '@/modules/core/helpers/types'
import { getServerInfo } from '@/modules/core/services/generic'
import { SendEmailParams, sendEmail } from '@/modules/emails/services/sending'
import { renderEmailWithSpeckleBasicTemplate } from '@/modules/emails/services/templateRendering'

const prepareWelcomeEmail = async (
  user: UserRecord,
  serverInfo: ServerInfo
): Promise<SendEmailParams> => {
  const mjml = `
<mj-text>
<h1>Hello from Speckle!</h1>
Hi ${user.name},

you just registered a user at ${serverInfo.name}.
Nice to meet you.
</mj-text>
`
  const text = ``
  const body = { mjml, text }
  const cta = {
    title: `GOTO ${serverInfo.name.toUpperCase()};`,
    url: serverInfo.canonicalUrl
  }
  const subject = `Welcome to the ${serverInfo.name}`
  return renderEmailWithSpeckleBasicTemplate(subject, body, cta, serverInfo, user)
}

export async function sendWelcomeEmail(
  user: UserRecord,
  emailSender: (params: SendEmailParams) => Promise<boolean>
): Promise<boolean> {
  const serverInfo = await getServerInfo()
  return await emailSender(await prepareWelcomeEmail(user, serverInfo))
}

export function initializeEventListeners(): () => void {
  const quitCallbacks = [
    UsersEmitter.listen(UsersEvents.Created, async ({ user }) => {
      await sendWelcomeEmail(user, sendEmail)
    })
  ]
  return () => quitCallbacks.forEach((quit) => quit())
}
