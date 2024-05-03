import {
  createFunction,
  triggerAutomationRun,
  updateFunction as execEngineUpdateFunction,
  getFunction,
  getFunctionRelease
} from '@/modules/automate/clients/executionEngine'
import {
  getAutomation,
  getAutomationTriggerDefinitions,
  storeAutomation,
  storeAutomationRevision,
  updateAutomation as updateDbAutomation
} from '@/modules/automate/repositories/automations'
import {
  createAutomation,
  createAutomationRevision,
  updateAutomation
} from '@/modules/automate/services/automationManagement'
import {
  createStoredAuthCode,
  validateStoredAuthCode
} from '@/modules/automate/services/executionEngine'
import {
  createFunctionFromTemplate,
  updateFunction
} from '@/modules/automate/services/functionManagement'
import {
  Resolvers,
  AutomateRunTriggerType
} from '@/modules/core/graph/generated/graphql'
import { getGenericRedis } from '@/modules/core/index'
import { getUser } from '@/modules/core/repositories/users'
import { createAutomation as clientCreateAutomation } from '@/modules/automate/clients/executionEngine'
import { validateStreamAccess } from '@/modules/core/services/streams/streamAccessService'
import { Roles } from '@speckle/shared'
import {
  getBranchLatestCommits,
  getBranchesByIds
} from '@/modules/core/repositories/branches'
import {
  manuallyTriggerAutomation,
  triggerAutomationRevisionRun
} from '@/modules/automate/services/trigger'

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
  Project: {
    async automation(parent, args, ctx) {
      return ctx.loaders.streams.getAutomation.forStream(parent.id).load(args.id)
    }
  },
  Automation: {
    async currentRevision(parent, _args, ctx) {
      return ctx.loaders.automations.getLatestAutomationRevision.load(parent.id)
    }
  },
  AutomateMutations: {
    async createFunction(_parent, args, ctx) {
      const create = createFunctionFromTemplate({
        createExecutionEngineFn: createFunction,
        getUser
      })

      return (await create({ input: args.input, userId: ctx.userId! })).graphqlReturn
    },
    async updateFunction(_parent, args, ctx) {
      const update = updateFunction({
        updateFunction: execEngineUpdateFunction,
        getFunction
      })
      return await update({ input: args.input, userId: ctx.userId! })
    }
  },
  ProjectAutomationMutations: {
    async create(parent, { input }, ctx) {
      const create = createAutomation({
        createAuthCode: createStoredAuthCode({ redis: getGenericRedis() }),
        automateCreateAutomation: clientCreateAutomation,
        storeAutomation
      })

      return (
        await create({
          input,
          userId: ctx.userId!,
          projectId: parent.projectId,
          userResourceAccessRules: ctx.resourceAccessRules
        })
      ).automation
    },
    async update(parent, { input }, ctx) {
      const update = updateAutomation({
        getAutomation,
        updateAutomation: updateDbAutomation
      })

      return await update({
        input,
        userId: ctx.userId!,
        projectId: parent.projectId,
        userResourceAccessRules: ctx.resourceAccessRules
      })
    },
    async createRevision(parent, { input }, ctx) {
      const create = createAutomationRevision({
        getAutomation,
        storeAutomationRevision,
        getBranchesByIds,
        getFunctionRelease
      })

      return await create({
        input,
        projectId: parent.projectId,
        userId: ctx.userId!,
        userResourceAccessRules: ctx.resourceAccessRules
      })
    },
    async trigger(parent, { automationId }, ctx) {
      const trigger = manuallyTriggerAutomation({
        getAutomationTriggerDefinitions,
        getAutomation,
        getBranchLatestCommits,
        triggerFunction: triggerAutomationRevisionRun({
          automateRunTrigger: triggerAutomationRun
        })
      })

      await trigger({
        automationId,
        userId: ctx.userId!,
        userResourceAccessRules: ctx.resourceAccessRules,
        projectId: parent.projectId
      })

      return true
    }
  },
  Query: {
    async automateValidateAuthCode(_parent, { code }) {
      const validate = validateStoredAuthCode({
        redis: getGenericRedis()
      })
      return await validate(code)
    }
  },
  ProjectMutations: {
    async automationMutations(_parent, { projectId }, ctx) {
      await validateStreamAccess(
        ctx.userId!,
        projectId,
        Roles.Stream.Owner,
        ctx.resourceAccessRules
      )
      return { projectId }
    }
  },
  Mutation: {
    automateMutations: () => ({})
  }
} as Resolvers
