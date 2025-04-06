import { Knex } from 'knex'
import {
  GetAutomationTemplates,
  UpsertAutomationTemplate
} from '@/modules/automate/domain/operations'
import { AutomationTemplate } from '@/modules/automate/domain/types'
import { AutomationTemplates } from '@/modules/core/dbSchema'

const tables = {
  automationTemplates: (db: Knex) => db<AutomationTemplate>(AutomationTemplates.name)
}

export const upsertAutomationTemplateFactory =
  ({ db }: { db: Knex }): UpsertAutomationTemplate =>
  async ({ template }) => {
    await tables
      .automationTemplates(db)
      .insert(template)
      .onConflict(AutomationTemplates.withoutTablePrefix.col.id)
      .merge([
        AutomationTemplates.withoutTablePrefix.col.enableAutoCreate,
        AutomationTemplates.withoutTablePrefix.col.functionId,
        AutomationTemplates.withoutTablePrefix.col.functionInputs,
        AutomationTemplates.withoutTablePrefix.col.functionRevisionId,
        AutomationTemplates.withoutTablePrefix.col.name,
        AutomationTemplates.withoutTablePrefix.col.updatedAt,
        AutomationTemplates.withoutTablePrefix.col.workspaceId
      ] as (keyof AutomationTemplate)[])
  }

export const getAutomationTemplatesFactory =
  ({ db }: { db: Knex }): GetAutomationTemplates =>
  async ({ workspaceId }) => {
    return await tables.automationTemplates(db).select('*').where({ workspaceId })
  }
