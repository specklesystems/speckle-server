import { GetServerInfo } from '@/modules/core/domain/server/operations'
import { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import { RenderEmail, SendEmail } from '@/modules/emails/domain/operations'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { SendWorkspaceJoinRequestApprovedEmail } from '@/modules/workspaces/domain/operations'

type WorkspaceJoinRequestApprovedEmailArgs = {
  workspace: { id: string; name: string; slug: string }
  requester: { id: string; name: string }
}

const buildMjmlBody = ({
  workspace,
  requester
}: WorkspaceJoinRequestApprovedEmailArgs) => {
  const bodyStart = `<mj-text align="center" line-height="2">
Hi ${requester.name}!
<br/>
<br/>
You are now a member of the workspace <span style="font-weight: bold;">${workspace.name}</span>.
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
}: WorkspaceJoinRequestApprovedEmailArgs) => {
  const bodyStart = `
Hi ${requester.name}!
\r\n\r\n
You are now a member of the workspace ${workspace.name}.
\r\n\r\n
    `
  const bodyEnd = `Have questions or feedback? Please write us at hello@speckle.systems and we'd be more than happy to talk.`
  return { bodyStart, bodyEnd }
}

const buildEmailTemplateParams = (args: WorkspaceJoinRequestApprovedEmailArgs) => {
  const url = new URL(
    `workspaces/${args.workspace.slug}`,
    getFrontendOrigin()
  ).toString()
  return {
    mjml: buildMjmlBody(args),
    text: buildTextBody(args),
    cta: {
      title: 'Open workspace',
      url
    }
  }
}

export const sendWorkspaceJoinRequestApprovedEmailFactory =
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
    const subject = 'You have joined a workspace'
    const sendEmailParams = {
      html,
      text,
      subject,
      to: userEmails.map((e) => e.email)
    }
    await sendEmail(sendEmailParams)
  }
