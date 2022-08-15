import { packageRoot } from '@/bootstrap'
import path from 'path'
import ejs from 'ejs'

type MultiTypeEmailBody = {
  text: string
  html: string
}

export type BasicEmailTemplateParams = {
  html: { bodyStart?: string; bodyEnd?: string }
  text: { bodyStart?: string; bodyEnd?: string }
  cta?: {
    url: string
    title: string
    altTitle?: string
  }
  server: {
    name: string
    url: string
    company: string
    contact: string
  }
}

function getPathToTemplatesDir(): string {
  return path.resolve(packageRoot, './assets/emails/templates/')
}

function buildTemplatePath(name: string, ext: string): string {
  return path.resolve(getPathToTemplatesDir(), `./${name}/${name}.${ext}`)
}

/**
 * Build an e-mail body using the 'basic' template
 */
export async function buildBasicTemplateEmail(
  params: BasicEmailTemplateParams
): Promise<MultiTypeEmailBody> {
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
