import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { GetServerInfo } from '@/modules/core/domain/server/operations'
import { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import { GetUser } from '@/modules/core/domain/users/operations'
import { RenderEmail, SendEmail } from '@/modules/emails/domain/operations'
import { NotFoundError } from '@/modules/shared/errors'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import {
  CreateWorkspaceJoinRequest,
  GetWorkspace,
  GetWorkspaceCollaborators,
  SendWorkspaceJoinRequestReceivedEmail,
  UpdateWorkspaceJoinRequestStatus
} from '@/modules/workspaces/domain/operations'
import { Roles } from '@speckle/shared'

export const dismissWorkspaceJoinRequestFactory =
  ({
    getWorkspace,
    updateWorkspaceJoinRequestStatus
  }: {
    getWorkspace: GetWorkspace
    updateWorkspaceJoinRequestStatus: UpdateWorkspaceJoinRequestStatus
  }) =>
    async ({ userId, workspaceId }: { userId: string; workspaceId: string }) => {
      const workspace = await getWorkspace({ workspaceId })
      if (!workspace) {
        throw new WorkspaceNotFoundError()
      }
      await updateWorkspaceJoinRequestStatus({
        userId,
        workspaceId,
        status: 'dismissed'
      })
      return true
    }

type WorkspaceJoinRequestReceivedEmailArgs = {
  workspace: { id: string; name: string; slug: string }
  requester: { name: string; email: string }
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
The user <span style="font-weight: bold;">${requester.name}</span> (${requester.email}) requested to join the workspace <span style="font-weight: bold;">${workspace.name}</span>. You can approve or deny the request from the workspace's members settings.
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
The user ${requester.name} (${requester.email}) requested to join the workspace ${workspace.name}. You can approve or deny the request from the workspace's members settings.
\r\n\r\n
    `
  const bodyEnd = `Have questions or feedback? Please write us at hello@speckle.systems and we'd be more than happy to talk.`
  return { bodyStart, bodyEnd }
}

const buildEmailTemplateParams = (args: WorkspaceJoinRequestReceivedEmailArgs) => {
  const url = new URL(`workspaces/${args.workspace.slug}`, getServerOrigin()).toString()
  return {
    mjml: buildMjmlBody(args),
    text: buildTextBody(args),
    cta: {
      title: 'A user requested to join your workspace',
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
  }) =>
    async (args: Omit<WorkspaceJoinRequestReceivedEmailArgs, 'workspaceAdmin'>) => {
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
          const subject = 'Workspace join request received'
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

export const requestToJoinWorkspaceFactory =
  ({
    createWorkspaceJoinRequest,
    sendWorkspaceJoinRequestReceivedEmail,
    getUserById,
    getWorkspace
  }: {
    createWorkspaceJoinRequest: CreateWorkspaceJoinRequest
    sendWorkspaceJoinRequestReceivedEmail: SendWorkspaceJoinRequestReceivedEmail
    getUserById: GetUser
    getWorkspace: GetWorkspace
  }) =>
    async ({ userId, workspaceId }: { userId: string; workspaceId: string }) => {
      await createWorkspaceJoinRequest({
        userId,
        workspaceId,
        status: 'pending'
      })

      const requester = await getUserById(userId)
      if (!requester) {
        throw new NotFoundError('User not found')
      }

      const workspace = await getWorkspace({ workspaceId })
      if (!workspace) {
        throw new NotFoundError('Workspace not found')
      }

      await sendWorkspaceJoinRequestReceivedEmail({
        workspace,
        requester
      })

      return true
    }
