import { createFunction } from '@/modules/automate/clients/executionEngine'
import {
  getUserGithubAuthData,
  setUserGithubAuthData
} from '@/modules/automate/repositories/automations'
import {
  generateFunctionId,
  getFunction,
  upsertFunction,
  updateFunction as updateDbFunction
} from '@/modules/automate/repositories/functions'
import { validateStoredAuthCode } from '@/modules/automate/services/createAutomation'
import { createStoredAuthCode } from '@/modules/automate/services/executionEngine'
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
        generateFunctionId
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
  Query: {
    async automateValidateAuthCode(_parent, { code }) {
      const validate = validateStoredAuthCode({
        redis: getGenericRedis()
      })
      return await validate(code)
    }
  },
  Mutation: {
    automateMutations: () => ({})
  }
} as Resolvers
