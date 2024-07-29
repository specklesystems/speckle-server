import { UserRecord } from '@/modules/core/helpers/types'
import { packageRoot } from '@/bootstrap'
import path from 'path'
import mjml2html from 'mjml'
import * as ejs from 'ejs'
import sanitizeHtml from 'sanitize-html'

export type EmailTemplateServerInfo = {
  name: string
  canonicalUrl: string
  company: string
  adminContact: string
}

export type EmailCta = {
  title: string
  url: string
}

export type EmailBody = {
  text: string
  mjml: string
}

export type EmailTemplateParams = {
  mjml: { bodyStart: string; bodyEnd?: string }
  text: { bodyStart: string; bodyEnd?: string }
  cta?: {
    url: string
    title: string
    altTitle?: string
  }
}

export type EmailInput = {
  from?: string
  to: string
  subject: string
  text: string
  html: string
}

export type EmailContent = {
  text: string
  html: string
}

export const renderEmail = async (
  templateParams: EmailTemplateParams,
  serverInfo: EmailTemplateServerInfo,
  user: UserRecord | null = null
): Promise<EmailContent> => {
  const [html, text] = await Promise.all([
    renderEmailHtml(templateParams, serverInfo, user),
    renderEmailText(templateParams, serverInfo)
  ])
  return {
    text,
    html
  }
}

const renderEmailHtml = async (
  templateParams: EmailTemplateParams,
  serverInfo: EmailTemplateServerInfo,
  user: UserRecord | null = null
): Promise<string> => {
  const mjmlPath = path.resolve(
    packageRoot,
    'assets/emails/templates/speckleBasicEmailTemplate.mjml.ejs'
  )
  const params = {
    cta: templateParams.cta,
    // i know, the parameter names need reshuffling
    body: { mjml: templateParams.mjml.bodyStart },
    bodyEnd: { mjml: templateParams.mjml.bodyEnd },
    user,
    serverInfo
  }
  const fullMjml = await ejs.renderFile(
    mjmlPath,
    { params },
    { cache: false, outputFunctionName: 'print' }
  )
  const fullHtml = mjml2html(fullMjml, {
    filePath: mjmlPath,
    mjmlConfigPath: path.resolve(packageRoot, './assets/emails/config/.mjmlconfig')
  })
  const renderedHtml = ejs.render(fullHtml.html, { params })

  return renderedHtml
}

const renderEmailText = async (
  templateParams: EmailTemplateParams,
  serverInfo: EmailTemplateServerInfo
): Promise<string> => {
  const ejsPath = path.resolve(
    packageRoot,
    'assets/emails/templates/speckleBasicEmailTemplate.txt.ejs'
  )
  const params = {
    cta: templateParams.cta,
    text: {
      bodyStart: templateParams.text.bodyStart,
      bodyEnd: templateParams.text.bodyEnd
    },
    server: serverInfo
  }
  const fullText = await ejs.renderFile(
    ejsPath,
    { params },
    { cache: false, outputFunctionName: 'print' }
  )
  return fullText
}

/**
 * Sanitize message that potentially has HTML in it
 */
export function sanitizeMessage(message: string, stripAll: boolean = false): string {
  return sanitizeHtml(message, {
    allowedTags: stripAll ? [] : ['b', 'i', 'em', 'strong']
  })
}
