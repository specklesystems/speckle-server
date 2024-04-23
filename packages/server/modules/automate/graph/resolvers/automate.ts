import {
  Resolvers,
  AutomateRunTriggerType
} from '@/modules/core/graph/generated/graphql'

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
    automateValidateAuthCode() {
      return true
    }
  }
} as Resolvers
