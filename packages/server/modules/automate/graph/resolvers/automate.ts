import { createFunction } from '@/modules/automate/clients/executionEngine'
import {
  getAutomation,
  getUserGithubAuthData,
  setUserGithubAuthData,
  storeAutomation,
  storeAutomationRevision,
  updateAutomation as updateDbAutomation
} from '@/modules/automate/repositories/automations'
import {
  generateFunctionId,
  getFunction,
  upsertFunction,
  updateFunction as updateDbFunction,
  upsertFunctionToken,
  getFunctionReleases
} from '@/modules/automate/repositories/functions'
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
import { createAutomateRepoFromTemplate } from '@/modules/automate/services/github'
import {
  createRepoFromTemplate,
  encryptSecret,
  getRepoPublicKey,
  insertEnvVar,
  testAccessToken,
  upsertSecret
} from '@/modules/core/clients/github'
import {
  Resolvers,
  AutomateRunTriggerType
} from '@/modules/core/graph/generated/graphql'
import { getGenericRedis } from '@/modules/core/index'
import { getUser } from '@/modules/core/repositories/users'
import { getValidatedUserAuthMetadata } from '@/modules/core/services/githubApp'
import { getAutomateGithubClientInfo } from '@/modules/shared/helpers/envHelper'
import { createAutomation as clientCreateAutomation } from '@/modules/automate/clients/executionEngine'
import { validateStreamAccess } from '@/modules/core/services/streams/streamAccessService'
import { Roles } from '@speckle/shared'
import { getBranchesByIds } from '@/modules/core/repositories/branches'

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
  AutomateMutations: {
    async createFunction(_parent, args, ctx) {
      const { id, secret } = getAutomateGithubClientInfo()

      const getValidatedGithubAuthMetadata = getValidatedUserAuthMetadata({
        setUserGithubAuth: setUserGithubAuthData,
        getUserGithubAuth: getUserGithubAuthData,
        testGithubAccessToken: testAccessToken,
        env: {
          clientId: id,
          clientSecret: secret
        }
      })

      const create = createFunctionFromTemplate({
        createGithubRepo: createAutomateRepoFromTemplate({
          getValidatedGithubAuthMetadata,
          createRepoFromTemplate
        }),
        upsertFn: upsertFunction,
        createExecutionEngineFn: createFunction,
        generateAuthCode: createStoredAuthCode({ redis: getGenericRedis() }),
        getValidatedGithubAuthMetadata,
        getGithubRepoPublicKey: getRepoPublicKey,
        encryptGithubSecret: encryptSecret,
        upsertGithubSecret: upsertSecret,
        insertGithubEnvVar: insertEnvVar,
        getUser,
        generateFunctionId,
        upsertFunctionToken
      })

      return (await create({ input: args.input, userId: ctx.userId! })).fn
    },
    async updateFunction(_parent, args, ctx) {
      const update = updateFunction({
        updateFunction: updateDbFunction,
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
        getFunctionReleases
      })

      return await create({
        input,
        projectId: parent.projectId,
        userId: ctx.userId!,
        userResourceAccessRules: ctx.resourceAccessRules
      })
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
