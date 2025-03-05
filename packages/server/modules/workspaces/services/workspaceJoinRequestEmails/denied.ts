import { GetServerInfo } from '@/modules/core/domain/server/operations'
import { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import { RenderEmail, SendEmail } from '@/modules/emails/domain/operations'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { SendWorkspaceJoinRequestApprovedEmail } from '@/modules/workspaces/domain/operations'

type WorkspaceJoinRequestDeniedEmailArgs = {
  workspace: { id: string; name: string; slug: string }
  requester: { id: string; name: string }
}

const buildMjmlBody = ({
  workspace,
  requester
}: WorkspaceJoinRequestDeniedEmailArgs) => {
  const bodyStart = `<mj-text align="center" line-height="2" >
Hi ${requester.name}!
<br/>
<br/>
Your request to join the workspace<span style="font-weight: bold;">${workspace.name}</span> was denied by the workspace admin.
</mj-text>
  `
  const bodyEnd = `<mj-text align="center" padding-bottom="0px" line-height="2">
<span style="font-weight: bold;">Have questions or feedback?</span><br/>Please write us at <a href="mailto:hello@speckle.systems" target="_blank">hello@speckle.systems</a> and we'd be more than happy to talk.
  </mj-text>`
  return { bodyStart, bodyEnd }
}

const buildTextBody = ({
  workspace,
  requester
}: WorkspaceJoinRequestDeniedEmailArgs) => {
  const bodyStart = `
Hi ${requester.name}!
\r\n\r\n
Your request to join the workspace ${workspace.name} was denied by the workspace admin.
\r\n\r\n
    `
  const bodyEnd = `Have questions or feedback? Please write us at hello@speckle.systems and we'd be more than happy to talk.`
  return { bodyStart, bodyEnd }
}

const buildEmailTemplateParams = (args: WorkspaceJoinRequestDeniedEmailArgs) => {
  const url = new URL(getFrontendOrigin()).toString()
  return {
    mjml: buildMjmlBody(args),
    text: buildTextBody(args),
    cta: {
      title: 'Open Speckle',
      url
    }
  }
}

export const sendWorkspaceJoinRequestDeniedEmailFactory =
  ({
    renderEmail,
    sendEmail,
    getServerInfo,
    getUserEmails
  }: {
    renderEmail: RenderEmail
    sendEmail: SendEmail
    getServerInfo: GetServerInfo
    getUserEmails: FindEmailsByUserId
  }): SendWorkspaceJoinRequestApprovedEmail =>
  async (args) => {
    const { requester, workspace } = args
    const serverInfo = await getServerInfo()

    const userEmails = await getUserEmails({ userId: requester.id })
    const emailTemplateParams = buildEmailTemplateParams({
      requester,
      workspace
    })
    const { html, text } = await renderEmail(emailTemplateParams, serverInfo, null)
    const subject = 'Request to join workspace denied'
    const sendEmailParams = {
      html,
      text,
      subject,
      to: userEmails.map((e) => e.email)
    }
    await sendEmail(sendEmailParams)
  }
