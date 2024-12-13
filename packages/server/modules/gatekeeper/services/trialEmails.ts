import { GetServerInfo } from '@/modules/core/domain/server/operations'
import { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import {
  EmailTemplateParams,
  RenderEmail,
  SendEmail,
  SendEmailParams
} from '@/modules/emails/domain/operations'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import { GetWorkspaceCollaborators } from '@/modules/workspaces/domain/operations'
import { WorkspaceTeamMember } from '@/modules/workspaces/domain/types'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { Roles } from '@speckle/shared'

type TrialExpiresArgs = {
  workspace: Workspace
  expiresInDays: number
}

type TrialExpiresArgsWithAdmin = TrialExpiresArgs & {
  workspaceAdmin: WorkspaceTeamMember
}

const buildMjmlBody = ({
  workspace,
  expiresInDays,
  workspaceAdmin
}: TrialExpiresArgsWithAdmin) => {
  const expireMessage =
    expiresInDays === 0
      ? `<strong>today</strong>!`
      : `in <strong>${expiresInDays} days</strong>!`
  const bodyStart = `<mj-text>
Hello ${workspaceAdmin.name}!
<br/>
<br/>
Your trial for your Speckle Workspace: <span style="font-variant: small-caps; font-weight: bold;">${workspace.name}</span> is about to expire ${expireMessage} 
<br/>To keep using your workspace you have to upgrade to a paid plan.
</mj-text>
  `
  const bodyEnd = `<mj-text>
If you have any feedback/questions <a href="mailto:hello@speckle.systems" target="_blank">send us an email!</a>
  </mj-text>`
  return { bodyStart, bodyEnd }
}

const buildTextBody = () => {
  const bodyStart = ''
  return { bodyStart }
}

const buildEmailTemplateParams = (
  args: TrialExpiresArgsWithAdmin
): EmailTemplateParams => {
  const url = new URL(`workspaces/${args.workspace.slug}`, getServerOrigin()).toString()
  return {
    mjml: buildMjmlBody(args),
    text: buildTextBody(),
    cta: {
      title: 'Upgrade your workspace!',
      url
    }
  }
}

export const sendWorkspaceTrialExpiresEmailFactory =
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
  }) =>
  async (args: TrialExpiresArgs) => {
    const [serverInfo, workspaceAdmins] = await Promise.all([
      getServerInfo(),
      getWorkspaceCollaborators({
        workspaceId: args.workspace.id,
        limit: 100,
        filter: { roles: [Roles.Workspace.Admin] }
      })
    ])
    const sendEmailParams = await Promise.all(
      workspaceAdmins.map(async (admin) => {
        const userEmails = await getUserEmails({ userId: admin.id })
        const emailTemplateParams = buildEmailTemplateParams({
          ...args,
          workspaceAdmin: admin
        })
        const { html, text } = await renderEmail(emailTemplateParams, serverInfo, null)
        const subject = 'Speckle Workspace trial expiry'
        const sendEmailParams: SendEmailParams = {
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
