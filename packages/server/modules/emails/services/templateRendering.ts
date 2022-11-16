import { packageRoot } from '@/bootstrap'
import path from 'path'
import { ServerInfo, UserRecord } from '@/modules/core/helpers/types'
import * as ejs from 'ejs'
import mjml2html from 'mjml'
import { CallToAction, EmailBody, EmailInput } from '@/modules/emails/helpers/types'
import { errorDebug } from '@/modules/shared/utils/logger'

export async function renderEmailWithSpeckleBasicTemplate(
  subject: string,
  body: EmailBody,
  cta: CallToAction,
  serverInfo: ServerInfo,
  user: UserRecord
): Promise<EmailInput> {
  const mjmlPath = path.resolve(
    packageRoot,
    'assets/emails/templates/speckleBasicEmailTemplate.mjml.ejs'
  )
  const params = {
    cta,
    body,
    user,
    serverInfo
  }
  const fullMjml = await ejs.renderFile(
    mjmlPath,
    { params },
    { cache: false, outputFunctionName: 'print' }
  )
  const fullHtml = mjml2html(fullMjml, { filePath: mjmlPath })
  if (fullHtml.errors.length) errorDebug('Email rendering failed', fullHtml.errors)
  const renderedHtml = ejs.render(fullHtml.html, { params })

  const text = `
    ${body.text}\n
    \n
    ${cta.title}\n
    ${cta.url}
    \n
    `

  return {
    to: user.email,
    subject,
    text,
    html: renderedHtml
  }
}
