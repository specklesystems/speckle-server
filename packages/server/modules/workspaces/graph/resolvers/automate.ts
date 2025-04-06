import {
  getAutomationTemplatesFactory,
  upsertAutomationTemplateFactory
} from '@/modules/automate/repositories/automationTemplates'
import {
  createAutomationTemplateFactory,
  listAutomationTemplatesFactory
} from '@/modules/automate/services/automationTemplates'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { db } from '@/db/knex'

export default {
  Workspace: {
    automationTemplates: async (parent) => {
      return await listAutomationTemplatesFactory({
        getAutomationTemplates: getAutomationTemplatesFactory({ db })
      })({
        workspaceId: parent.id
      })
    }
  },
  WorkspaceMutations: {
    createAutomationTemplate: async (_parent, args) => {
      return await createAutomationTemplateFactory({
        upsertAutomationTemplate: upsertAutomationTemplateFactory({ db })
      })({
        template: {
          ...args.input,
          functionInputs: args.input.functionInputs ?? null,
          enableAutoCreate: true
        }
      })
    }
  }
} as Resolvers
