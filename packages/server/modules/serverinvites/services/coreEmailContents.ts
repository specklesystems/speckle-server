import { GetStream } from '@/modules/core/domain/streams/operations'
import {
  getRegistrationRoute,
  getStreamRoute
} from '@/modules/core/helpers/routeHelper'
import { StreamRecord } from '@/modules/core/helpers/types'
import {
  EmailTemplateParams,
  sanitizeMessage
} from '@/modules/emails/services/emailRendering'
import {
  PrimaryInviteResourceTarget,
  ProjectInviteResourceTarget
} from '@/modules/serverinvites/domain/types'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import {
  isProjectResourceTarget,
  isServerResourceTarget
} from '@/modules/serverinvites/helpers/core'
import { BuildInviteEmailContents } from '@/modules/serverinvites/services/operations'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'

function buildServerMjmlPreamble(params: Parameters<BuildInviteEmailContents>[0]) {
  const { invite, serverInfo, inviter } = params
  const { message } = invite

  const bodyStart = `
  <mj-text>
  Hello!
  <br />
  <br />
  ${inviter.name} has just sent you this invitation to join the <b>${
    serverInfo.name
  }</b> Speckle Server!
  ${message ? inviter.name + ' said: <em>"' + message + '"</em>' : ''}
  </mj-text>
  `

  return {
    bodyStart,
    bodyEnd:
      '<mj-text>Feel free to ignore this invite if you do not know the person sending it.</mj-text>'
  }
}

function buildServerTextPreamble(params: Parameters<BuildInviteEmailContents>[0]) {
  const { invite, serverInfo, inviter } = params
  const { message } = invite

  const bodyStart = `Hello!

${inviter.name} has just sent you this invitation to join the ${
    serverInfo.name
  } Speckle Server!

${message ? inviter.name + ' said: "' + sanitizeMessage(message, true) + '"' : ''}`

  return {
    bodyStart,
    bodyEnd: 'Feel free to ignore this invite if you do not know the person sending it.'
  }
}

const buildServerEmailTemplateParams = (
  params: Parameters<BuildInviteEmailContents>[0]
): EmailTemplateParams => {
  const { invite } = params
  const inviteLink = new URL(
    `${getRegistrationRoute()}?token=${invite.token}`,
    getFrontendOrigin()
  ).toString()

  return {
    mjml: buildServerMjmlPreamble(params),
    text: buildServerTextPreamble(params),
    cta: {
      title: 'Accept the invitation',
      url: inviteLink
    }
  }
}

const buildServerInviteContentsFactory = (): BuildInviteEmailContents => (params) => {
  const { inviter } = params
  const subject = 'Speckle Invitation from ' + inviter.name

  return {
    emailParams: buildServerEmailTemplateParams(params),
    subject
  }
}

type BuildProjectInviteEmailContents = (
  params: Parameters<BuildInviteEmailContents>[0] & {
    primaryResourceTarget: PrimaryInviteResourceTarget<ProjectInviteResourceTarget>
  }
) => ReturnType<BuildInviteEmailContents>

function buildProjectMjmlPreamble(
  params: Parameters<BuildProjectInviteEmailContents>[0] & { project: StreamRecord }
) {
  const { invite, inviter, project } = params
  const { message } = invite

  const bodyStart = `
  <mj-text>
  Hello!
  <br />
  <br />
  ${
    inviter.name
  } has just sent you this invitation to become a collaborator on the <b>${
    project.name
  }</b> project!
  ${message ? inviter.name + ' said: <em>"' + message + '"</em>' : ''}
  </mj-text>
  `

  return {
    bodyStart,
    bodyEnd:
      '<mj-text>Feel free to ignore this invite if you do not know the person sending it.</mj-text>'
  }
}

function buildProjectTextPreamble(
  params: Parameters<BuildProjectInviteEmailContents>[0] & { project: StreamRecord }
) {
  const { invite, project, inviter } = params
  const { message } = invite

  const bodyStart = `Hello!

${inviter.name} has just sent you this invitation to become a collaborator on the "${
    project.name
  }" project!

${message ? inviter.name + ' said: "' + sanitizeMessage(message, true) + '"' : ''}`

  return {
    bodyStart,
    bodyEnd: 'Feel free to ignore this invite if you do not know the person sending it.'
  }
}

const buildProjectEmailTemplateParams = (
  params: Parameters<BuildProjectInviteEmailContents>[0] & { project: StreamRecord }
): EmailTemplateParams => {
  const { invite, project } = params
  const inviteLink = new URL(
    `${getStreamRoute(project.id)}?token=${invite.token}&accept=true`,
    getFrontendOrigin()
  ).toString()

  return {
    mjml: buildProjectMjmlPreamble(params),
    text: buildProjectTextPreamble(params),
    cta: {
      title: 'Accept the invitation',
      url: inviteLink
    }
  }
}

type BuildProjectInviteContentsFactoryDeps = { getStream: GetStream }

const buildProjectInviteContentsFactory =
  (deps: BuildProjectInviteContentsFactoryDeps): BuildProjectInviteEmailContents =>
  async (params) => {
    const { getStream } = deps
    const { inviter, primaryResourceTarget } = params

    const project = await getStream({ streamId: primaryResourceTarget.resourceId })
    if (!project) {
      throw new InviteCreateValidationError(
        'Attempting to invite into a non-existant project'
      )
    }

    const subject = `${inviter.name} wants to share the project "${project.name}" on Speckle with you`

    return {
      emailParams: buildProjectEmailTemplateParams({ ...params, project }),
      subject
    }
  }

export type BuildInviteContentsFactoryDeps = BuildProjectInviteContentsFactoryDeps

export const buildCoreInviteEmailContentsFactory =
  (deps: BuildProjectInviteContentsFactoryDeps): BuildInviteEmailContents =>
  (params) => {
    const { invite } = params
    const primaryResourceTarget = invite.resource

    if (isServerResourceTarget(primaryResourceTarget)) {
      return buildServerInviteContentsFactory()(params)
    } else if (isProjectResourceTarget(primaryResourceTarget)) {
      return buildProjectInviteContentsFactory(deps)({
        ...params,
        primaryResourceTarget
      })
    } else {
      throw new InviteCreateValidationError(
        'Unexpected resource target type: ' + primaryResourceTarget.resourceType
      )
    }
  }
