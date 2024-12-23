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
      ? `<strong>today</strong>`
      : `in <strong>${expiresInDays} days</strong>`
  const bodyStart = `<mj-text>
Hi ${workspaceAdmin.name}!
<br/>
<br/>
The trial for your workspace <span style="font-variant: small-caps; font-weight: bold;">${workspace.name}</span> expires ${expireMessage}.
<br/>
<br/>
Upgrade to a paid plan before the trial expires to keep using your workspace. You can compare plans and get an overview of your estimated billing from your workspace's billing settings.
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
  expiresInDays,
  workspaceAdmin
}: TrialExpiresArgsWithAdmin) => {
  const expireMessage = expiresInDays === 0 ? `today` : `in ${expiresInDays} days`
  const bodyStart = `

Hi ${workspaceAdmin.name}!
\r\n\r\n
The trial for your workspace ${workspace.name} expires ${expireMessage}.
\r\n\r\n
Upgrade to a paid plan before the trial expires to keep using your workspace. You can compare plans and get an overview of your estimated billing from your workspace's billing settings.
\r\n\r\n
    `
  const bodyEnd = `Have questions or feedback? Please write us at hello@speckle.systems and we'd be more than happy to talk.`
  return { bodyStart, bodyEnd }
}

const buildEmailTemplateParams = (
  args: TrialExpiresArgsWithAdmin
): EmailTemplateParams => {
  const url = new URL(`workspaces/${args.workspace.slug}`, getServerOrigin()).toString()
  return {
    mjml: buildMjmlBody(args),
    text: buildTextBody(args),
    cta: {
      title: 'Upgrade your workspace',
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
        const subject =
          args.expiresInDays === 0
            ? 'Your workspace trial expires today'
            : `Your workspace trial expires in ${args.expiresInDays} days`
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
