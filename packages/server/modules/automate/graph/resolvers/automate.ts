import { validateStoredAuthCode } from '@/modules/automate/services/createAutomation'
import {
  Resolvers,
  AutomateRunTriggerType
} from '@/modules/core/graph/generated/graphql'
import { getGenericRedis } from '@/modules/core/index'

export = {
  AutomationRevisionTriggerDefinition: {
    __resolveType(parent) {
      if (parent.type === AutomateRunTriggerType.VersionCreated) {
        return 'VersionCreatedTriggerDefinition'
      }
      return null
    }
  },
  AutomationRunTrigger: {
    __resolveType(parent) {
      if (parent.type === AutomateRunTriggerType.VersionCreated) {
        return 'VersionCreatedTrigger'
      }
      return null
    }
  },
  Query: {
    async automateValidateAuthCode(_parent, { code }) {
      const validate = validateStoredAuthCode({
        redis: getGenericRedis()
      })
      return await validate(code)
    }
  }
} as Resolvers
