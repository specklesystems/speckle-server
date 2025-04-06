import {
  GetAutomationTemplates,
  UpsertAutomationTemplate
} from '@/modules/automate/domain/operations'
import { AutomationTemplate } from '@/modules/automate/domain/types'
import cryptoRandomString from 'crypto-random-string'

export const createAutomationTemplateFactory =
  (deps: { upsertAutomationTemplate: UpsertAutomationTemplate }) =>
  async (params: {
    template: Omit<AutomationTemplate, 'id' | 'createdAt' | 'updatedAt'>
  }): Promise<AutomationTemplate> => {
    const template: AutomationTemplate = {
      ...params.template,
      id: cryptoRandomString({ length: 9 }),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await deps.upsertAutomationTemplate({ template })

    return template
  }

export const listAutomationTemplatesFactory =
  (deps: { getAutomationTemplates: GetAutomationTemplates }) =>
  async (params: { workspaceId: string }): Promise<AutomationTemplate[]> => {
    return await deps.getAutomationTemplates({ workspaceId: params.workspaceId })
  }
