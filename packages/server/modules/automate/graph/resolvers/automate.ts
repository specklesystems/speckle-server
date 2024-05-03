import {
  createFunction,
  triggerAutomationRun,
  updateFunction as execEngineUpdateFunction,
  getFunction,
  getFunctionRelease,
  getFunctions
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
  convertFunctionToGraphQLReturn,
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
import { Roles, isNullOrUndefined } from '@speckle/shared'
import {
  getBranchLatestCommits,
  getBranchesByIds
} from '@/modules/core/repositories/branches'
import {
  manuallyTriggerAutomation,
  triggerAutomationRevisionRun
} from '@/modules/automate/services/trigger'
import { AutomateFunctionReleaseGraphQLReturn } from '@/modules/automate/helpers/graphTypes'

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
  AutomateFunction: {
    async automationCount(parent, _args, ctx) {
      return ctx.loaders.automations.getFunctionAutomationCount.load(parent.id)
    },
    async releases(parent, args) {
      // TODO: Replace w/ dataloader batch call, when/if possible
      const fn = await getFunction({
        functionId: parent.id,
        releases:
          args?.cursor || args?.filter?.search || args?.limit
            ? {
                cursor: args.cursor || undefined,
                search: args.filter?.search || undefined,
                limit: args.limit || undefined
              }
            : {}
      })

      return {
        cursor: fn.versionCursor,
        totalCount: fn.versionCount,
        items: fn.functionVersions.map(
          (r): AutomateFunctionReleaseGraphQLReturn => ({
            id: r.functionVersionId,
            versionTag: r.versionTag,
            createdAt: new Date(r.createdAt),
            inputSchema: r.inputSchema,
            commitId: r.commitId,
            functionId: parent.id
          })
        )
      }
    }
  },
  AutomateFunctionRelease: {
    async function(parent, _args, ctx) {
      const fn = await ctx.loaders.automationsApi.getFunction.load(parent.functionId)
      return convertFunctionToGraphQLReturn(fn)
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
    },
    async automateFunction(_parent, { id }, ctx) {
      const fn = await ctx.loaders.automationsApi.getFunction.load(id)
      return convertFunctionToGraphQLReturn(fn)
    },
    async automateFunctions(_parent, args) {
      const res = await getFunctions({
        query: {
          query: args.filter?.search || undefined,
          cursor: args.cursor || undefined,
          limit: isNullOrUndefined(args.limit) ? undefined : args.limit,
          functionsWithoutVersions: args.filter?.functionsWithoutReleases || undefined,
          featuredFunctionsOnly: args.filter?.featuredFunctionsOnly || undefined
        }
      })

      return {
        cursor: res.cursor,
        totalCount: res.totalCount,
        items: res.items.map(convertFunctionToGraphQLReturn)
      }
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
