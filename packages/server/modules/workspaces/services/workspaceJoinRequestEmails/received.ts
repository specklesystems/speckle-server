import { GetServerInfo } from '@/modules/core/domain/server/operations'
import { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import { RenderEmail, SendEmail } from '@/modules/emails/domain/operations'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import {
  GetWorkspaceCollaborators,
  SendWorkspaceJoinRequestReceivedEmail
} from '@/modules/workspaces/domain/operations'
import { Roles } from '@speckle/shared'

type WorkspaceJoinRequestReceivedEmailArgs = {
  workspace: { id: string; name: string; slug: string }
  requester: { name: string }
  workspaceAdmin: { id: string; name: string }
}

const buildMjmlBody = ({
  workspace,
  requester,
  workspaceAdmin
}: WorkspaceJoinRequestReceivedEmailArgs) => {
  const bodyStart = `<mj-text>
Hi ${workspaceAdmin.name}!
<br/>
<br/>
<span style="font-weight: bold;">${requester.name}</span> is requesting to join your workspace <span style="font-weight: bold;">${workspace.name}</span>.
<br/>
<br/>

</mj-text>
  `
  const bodyEnd = `<mj-text>
<span style="font-weight: bold;">Have questions or feedback?</span> Please write us at <a href="mailto:hello@speckle.systems" target="_blank">hello@speckle.systems</a> and we'd be more than happy to talk.
  </mj-text>`
  return { bodyStart, bodyEnd }
}

const buildTextBody = ({
  workspace,
  requester,
  workspaceAdmin
}: WorkspaceJoinRequestReceivedEmailArgs) => {
  const bodyStart = `
Hi ${workspaceAdmin.name}!
\r\n\r\n
${requester.name} is requesting to join your workspace ${workspace.name}.
\r\n\r\n
    `
  const bodyEnd = `Have questions or feedback? Please write us at hello@speckle.systems and we'd be more than happy to talk.`
  return { bodyStart, bodyEnd }
}

const buildEmailTemplateParams = (args: WorkspaceJoinRequestReceivedEmailArgs) => {
  const url = new URL(
    `settings/workspaces/${args.workspace.slug}/members`,
    getFrontendOrigin()
  ).toString()
  return {
    mjml: buildMjmlBody(args),
    text: buildTextBody(args),
    cta: {
      title: 'Manage Members',
      url
    }
  }
}

export const sendWorkspaceJoinRequestReceivedEmailFactory =
  ({
    renderEmail,
    sendEmail,
    getServerInfo,
    getWorkspaceCollaborators,
    getUserEmails
  }: {
    renderEmail: RenderEmail
    sendEmail: SendEmail
    getServerInfo: GetServerInfo
    getWorkspaceCollaborators: GetWorkspaceCollaborators
    getUserEmails: FindEmailsByUserId
  }): SendWorkspaceJoinRequestReceivedEmail =>
  async (args) => {
    const { requester, workspace } = args
    const [serverInfo, workspaceAdmins] = await Promise.all([
      getServerInfo(),
      getWorkspaceCollaborators({
        workspaceId: workspace.id,
        limit: 100,
        filter: { roles: [Roles.Workspace.Admin] }
      })
    ])
    const sendEmailParams = await Promise.all(
      workspaceAdmins.map(async (admin) => {
        const userEmails = await getUserEmails({ userId: admin.id })
        const emailTemplateParams = buildEmailTemplateParams({
          requester,
          workspace,
          workspaceAdmin: admin
        })
        const { html, text } = await renderEmail(emailTemplateParams, serverInfo, null)
        const subject = `${requester.name} wants to join your workspace`
        const sendEmailParams = {
          html,
          text,
          subject,
          to: userEmails.map((e) => e.email)
        }
        return sendEmailParams
      })
    )
    await Promise.all(sendEmailParams.map((params) => sendEmail(params)))
  }
