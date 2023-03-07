import { packageRoot } from '@/bootstrap'
import path from 'path'
import ejs from 'ejs'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { getServerInfo } from '@/modules/core/services/generic'
import { ServerInfo } from '@/modules/core/helpers/types'

type MultiTypeEmailBody = {
  text: string
  html: string
}

export type EmailTemplateServerInfo = {
  name: string
  url: string
  company: string
  contact: string
}

export type BasicEmailTemplateParams = {
  html: { bodyStart?: string; bodyEnd?: string }
  text: { bodyStart?: string; bodyEnd?: string }
  cta?: {
    url: string
    title: string
    altTitle?: string
  }
  /**
   * If not set, this data will be automatically resolved from serverInfo
   */
  server?: EmailTemplateServerInfo
}

function getPathToTemplatesDir(): string {
  return path.resolve(packageRoot, './assets/emails/templates/')
}

function buildTemplatePath(name: string, ext: string): string {
  return path.resolve(getPathToTemplatesDir(), `./${name}/${name}.${ext}`)
}

/**
 * Build template params `server` object from a ServerInfo structure
 */
export function buildBasicTemplateServerInfo(
  serverInfo: ServerInfo
): EmailTemplateServerInfo {
  return {
    name: serverInfo.name,
    url: getFrontendOrigin(),
    company: serverInfo.company,
    contact: serverInfo.adminContact
  }
}

/**
 * Build an e-mail body using the 'basic' template
 */
export async function buildBasicTemplateEmail(
  params: BasicEmailTemplateParams
): Promise<MultiTypeEmailBody> {
  if (!params.server) {
    const serverInfo = await getServerInfo()
    params.server = buildBasicTemplateServerInfo(serverInfo)
  }

  const textPath = buildTemplatePath('basic', 'txt')
  const htmlPath = buildTemplatePath('basic', 'html')

  const [text, html] = await Promise.all([
    ejs.renderFile(textPath, { params }, { cache: true, outputFunctionName: 'print' }),
    ejs.renderFile(htmlPath, { params }, { cache: true, outputFunctionName: 'print' })
  ])

  return {
    text,
    html
  }
}
