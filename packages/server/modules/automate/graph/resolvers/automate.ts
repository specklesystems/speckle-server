import {
  createFunction,
  triggerAutomationRun,
  updateFunction as execEngineUpdateFunction,
  getFunction,
  getFunctionRelease,
  getFunctions,
  getFunctionReleases,
  getUserGithubAuthState
} from '@/modules/automate/clients/executionEngine'
import {
  GetProjectAutomationsParams,
  getAutomation,
  getAutomationRunsItems,
  getAutomationRunsTotalCount,
  getAutomationTriggerDefinitions,
  getFullAutomationRevisionMetadata,
  getFunctionRun,
  getLatestAutomationRevision,
  getLatestVersionAutomationRuns,
  getProjectAutomationsItems,
  getProjectAutomationsTotalCount,
  storeAutomation,
  storeAutomationRevision,
  storeAutomationToken,
  updateAutomationRun,
  updateAutomation as updateDbAutomation,
  upsertAutomationFunctionRun
} from '@/modules/automate/repositories/automations'
import {
  createAutomation,
  createAutomationRevision,
  createTestAutomation,
  getAutomationsStatus,
  updateAutomation
} from '@/modules/automate/services/automationManagement'
import {
  createStoredAuthCode,
  validateStoredAuthCode
} from '@/modules/automate/services/executionEngine'
import {
  convertFunctionReleaseToGraphQLReturn,
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
import {
  Automate,
  Environment,
  Roles,
  isNullOrUndefined,
  isNonNullable
} from '@speckle/shared'
import {
  getBranchLatestCommits,
  getBranchesByIds
} from '@/modules/core/repositories/branches'
import {
  createTestAutomationRun,
  manuallyTriggerAutomation,
  triggerAutomationRevisionRun
} from '@/modules/automate/services/trigger'
import {
  reportFunctionRunStatus,
  ReportFunctionRunStatusDeps
} from '@/modules/automate/services/runsManagement'
import {
  AutomationNotFoundError,
  FunctionNotFoundError
} from '@/modules/automate/errors/management'
import {
  FunctionReleaseSchemaType,
  dbToGraphqlTriggerTypeMap,
  functionTemplateRepos
} from '@/modules/automate/helpers/executionEngine'
import { authorizeResolver } from '@/modules/shared'
import {
  AutomationRevisionFunctionForInputRedaction,
  getEncryptionKeyPair,
  getEncryptionKeyPairFor,
  getEncryptionPublicKey,
  getFunctionInputDecryptor,
  getFunctionInputsForFrontend
} from '@/modules/automate/services/encryption'
import { buildDecryptor } from '@/modules/shared/utils/libsodium'
import { keyBy } from 'lodash'
import { redactWriteOnlyInputData } from '@/modules/automate/utils/jsonSchemaRedactor'
import {
  ProjectSubscriptions,
  filteredSubscribe
} from '@/modules/shared/utils/subscriptions'
import {
  mapDbStatusToGqlStatus,
  mapGqlStatusToDbStatus
} from '@/modules/automate/utils/automateFunctionRunStatus'
import { AutomateApiDisabledError } from '@/modules/automate/errors/core'
import {
  ExecutionEngineFailedResponseError,
  ExecutionEngineNetworkError
} from '@/modules/automate/errors/executionEngine'

/**
 * TODO:
 * - FE:
 *  - Fix up pagination & all remaining TODOs
 *  - Subscriptions & cache updates
 */

const { FF_AUTOMATE_MODULE_ENABLED } = Environment.getFeatureFlags()

export = (FF_AUTOMATE_MODULE_ENABLED
  ? {
      /**
       * If automate module is enabled
       */
      AutomationRevisionTriggerDefinition: {
        __resolveType(parent) {
          if (
            dbToGraphqlTriggerTypeMap[parent.triggerType] ===
            AutomateRunTriggerType.VersionCreated
          ) {
            return 'VersionCreatedTriggerDefinition'
          }
          return null
        }
      },
      AutomationRunTrigger: {
        __resolveType(parent) {
          if (
            dbToGraphqlTriggerTypeMap[parent.triggerType] ===
            AutomateRunTriggerType.VersionCreated
          ) {
            return 'VersionCreatedTrigger'
          }
          return null
        }
      },
      VersionCreatedTriggerDefinition: {
        type: () => AutomateRunTriggerType.VersionCreated,
        async model(parent, _args, ctx) {
          return ctx.loaders.branches.getById.load(parent.triggeringId)
        }
      },
      VersionCreatedTrigger: {
        type: () => AutomateRunTriggerType.VersionCreated,
        async version(parent, _args, ctx) {
          return ctx.loaders.commits.getById.load(parent.triggeringId)
        },
        async model(parent, _args, ctx) {
          return ctx.loaders.commits.getCommitBranch.load(parent.triggeringId)
        }
      },
      ProjectTriggeredAutomationsStatusUpdatedMessage: {
        async project(parent, _args, ctx) {
          return ctx.loaders.streams.getStream.load(parent.projectId)
        },
        async model(parent, _args, ctx) {
          return ctx.loaders.branches.getById.load(parent.modelId)
        },
        async version(parent, _args, ctx) {
          return ctx.loaders.commits.getById.load(parent.versionId)
        }
      },
      Project: {
        async automation(parent, args, ctx) {
          const res = ctx.loaders.streams.getAutomation
            .forStream(parent.id)
            .load(args.id)
          if (!res) {
            if (!res) {
              throw new AutomationNotFoundError()
            }
          }

          return res
        },
        async automations(parent, args) {
          const retrievalArgs: GetProjectAutomationsParams = {
            projectId: parent.id,
            args
          }

          const [{ items, cursor }, totalCount] = await Promise.all([
            getProjectAutomationsItems(retrievalArgs),
            getProjectAutomationsTotalCount(retrievalArgs)
          ])

          return {
            items,
            totalCount,
            cursor
          }
        }
      },
      Model: {
        async automationsStatus(parent, _args, ctx) {
          const getStatus = getAutomationsStatus({
            getLatestVersionAutomationRuns
          })

          const modelId = parent.id
          const projectId = parent.streamId
          const latestCommit = await ctx.loaders.branches.getLatestCommit.load(
            parent.id
          )

          // if the model has no versions, no automations could have run
          if (!latestCommit) return null

          return await getStatus({
            projectId,
            modelId,
            versionId: latestCommit.id
          })
        }
      },
      Version: {
        async automationsStatus(parent, _args, ctx) {
          const getStatus = getAutomationsStatus({
            getLatestVersionAutomationRuns
          })

          const versionId = parent.id
          const branch = await ctx.loaders.commits.getCommitBranch.load(versionId)
          if (!branch) throw Error('Invalid version Id')

          const projectId = branch.streamId
          const modelId = branch.id
          return await getStatus({
            projectId,
            modelId,
            versionId
          })
        }
      },
      Automation: {
        async currentRevision(parent, _args, ctx) {
          return ctx.loaders.automations.getLatestAutomationRevision.load(parent.id)
        },
        async runs(parent, args) {
          const retrievalArgs = {
            automationId: parent.id,
            ...args
          }

          const [{ items, cursor }, totalCount] = await Promise.all([
            getAutomationRunsItems({
              args: retrievalArgs
            }),
            getAutomationRunsTotalCount({
              args: retrievalArgs
            })
          ])

          return {
            items,
            totalCount,
            cursor
          }
        },
        async creationPublicKeys(parent, _args, ctx) {
          await authorizeResolver(
            ctx.userId!,
            parent.projectId,
            Roles.Stream.Owner,
            ctx.resourceAccessRules
          )

          const publicKey = await getEncryptionPublicKey()
          return [publicKey]
        }
      },
      AutomateRun: {
        async trigger(parent, _args, ctx) {
          const triggers =
            parent.triggers ||
            (await ctx.loaders.automations.getRunTriggers.load(parent.id))

          const trigger = triggers[0]
          return trigger
        },
        async functionRuns(parent) {
          return parent.functionRuns
        },
        async automation(parent, _args, ctx) {
          return ctx.loaders.automations.getAutomation.load(parent.automationId)
        },
        status: (parent) => mapDbStatusToGqlStatus(parent.status)
      },
      TriggeredAutomationsStatus: {
        status: (parent) => mapDbStatusToGqlStatus(parent.status)
      },
      AutomateFunctionRun: {
        async function(parent, _args, ctx) {
          const fn = await ctx.loaders.automationsApi.getFunction.load(
            parent.functionId
          )
          if (!fn) {
            ctx.log.warn(
              { id: parent.functionId, fnRunId: parent.id, runid: parent.runId },
              'AutomateFunctionRun function unexpectedly not found'
            )
            return null
          }

          return convertFunctionToGraphQLReturn(fn)
        },
        results(parent, _args, ctx) {
          try {
            return parent.results
              ? Automate.AutomateTypes.formatResultsSchema(parent.results)
              : null
          } catch (e) {
            ctx.log.warn('Error formatting results schema', e)
          }
        },
        status: (parent) => mapDbStatusToGqlStatus(parent.status)
      },
      AutomationRevision: {
        async triggerDefinitions(parent, _args, ctx) {
          const triggers =
            await ctx.loaders.automations.getRevisionTriggerDefinitions.load(parent.id)

          return triggers
        },
        async functions(parent, _args, ctx) {
          const prepareInputs = getFunctionInputsForFrontend({
            getEncryptionKeyPairFor,
            buildDecryptor,
            redactWriteOnlyInputData
          })

          const fns = await ctx.loaders.automations.getRevisionFunctions.load(parent.id)
          const fnsReleases = keyBy(
            (
              await ctx.loaders.automationsApi.getFunctionRelease.loadMany(
                fns.map((fn) => [fn.functionId, fn.functionReleaseId])
              )
            ).filter(
              (r): r is FunctionReleaseSchemaType => r !== null && !(r instanceof Error)
            ),
            (r) => r.functionVersionId
          )

          const fnsForRedaction: Array<AutomationRevisionFunctionForInputRedaction | null> =
            fns.map((fn) => {
              const release = fnsReleases[fn.functionReleaseId]
              if (!release) {
                return null
              }

              return {
                ...fn,
                release
              }
            })

          return prepareInputs({
            fns: fnsForRedaction.filter(isNonNullable),
            publicKey: parent.publicKey
          })
        }
      },
      AutomationRevisionFunction: {
        async parameters(parent) {
          return parent.functionInputs
        }
      },
      AutomateFunction: {
        async automationCount(parent, _args, ctx) {
          return ctx.loaders.automations.getFunctionAutomationCount.load(parent.id)
        },
        async releases(parent, args) {
          try {
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
              items: fn.functionVersions.map((r) =>
                convertFunctionReleaseToGraphQLReturn({ ...r, functionId: parent.id })
              )
            }
          } catch (e) {
            const isNotFound =
              e instanceof ExecutionEngineFailedResponseError &&
              e.response.statusMessage === 'FunctionNotFound'
            if (e instanceof ExecutionEngineNetworkError || isNotFound) {
              return {
                cursor: null,
                totalCount: 0,
                items: []
              }
            }

            throw e
          }
        }
      },
      AutomateFunctionRelease: {
        async function(parent, _args, ctx) {
          const fn = await ctx.loaders.automationsApi.getFunction.load(
            parent.functionId
          )
          if (!fn) {
            throw new FunctionNotFoundError('Function not found', {
              info: { id: parent.functionId }
            })
          }

          return convertFunctionToGraphQLReturn(fn)
        }
      },
      AutomateMutations: {
        async createFunction(_parent, args, ctx) {
          const create = createFunctionFromTemplate({
            createExecutionEngineFn: createFunction,
            getUser
          })

          return (await create({ input: args.input, userId: ctx.userId! }))
            .graphqlReturn
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
          const testAutomateAuthCode = process.env['TEST_AUTOMATE_AUTHENTICATION_CODE']
          const create = createAutomation({
            createAuthCode: testAutomateAuthCode
              ? async () => testAutomateAuthCode
              : createStoredAuthCode({ redis: getGenericRedis() }),
            automateCreateAutomation: clientCreateAutomation,
            storeAutomation,
            storeAutomationToken
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
            getFunctionRelease,
            getEncryptionKeyPair,
            getFunctionInputDecryptor: getFunctionInputDecryptor({ buildDecryptor }),
            getFunctionReleases
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
              automateRunTrigger: triggerAutomationRun,
              getEncryptionKeyPairFor,
              getFunctionInputDecryptor: getFunctionInputDecryptor({ buildDecryptor })
            })
          })

          await trigger({
            automationId,
            userId: ctx.userId!,
            userResourceAccessRules: ctx.resourceAccessRules,
            projectId: parent.projectId
          })

          return true
        },
        async createTestAutomation(parent, { input }, ctx) {
          const create = createTestAutomation({
            getEncryptionKeyPair,
            getFunction,
            storeAutomation,
            storeAutomationRevision
          })

          return await create({
            input,
            projectId: parent.projectId,
            userId: ctx.userId!,
            userResourceAccessRules: ctx.resourceAccessRules
          })
        },
        async createTestAutomationRun(parent, { automationId }, ctx) {
          const create = createTestAutomationRun({
            getEncryptionKeyPairFor,
            getFunctionInputDecryptor: getFunctionInputDecryptor({
              buildDecryptor
            }),
            getAutomation,
            getLatestAutomationRevision,
            getFullAutomationRevisionMetadata
          })

          return await create({
            projectId: parent.projectId,
            automationId,
            userId: ctx.userId!
          })
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
          if (!fn) {
            throw new FunctionNotFoundError('Function not found', {
              info: { id }
            })
          }

          return convertFunctionToGraphQLReturn(fn)
        },
        async automateFunctions(_parent, args) {
          try {
            const res = await getFunctions({
              query: {
                query: args.filter?.search || undefined,
                cursor: args.cursor || undefined,
                limit: isNullOrUndefined(args.limit) ? undefined : args.limit,
                functionsWithoutVersions:
                  args.filter?.functionsWithoutReleases || undefined,
                featuredFunctionsOnly: args.filter?.featuredFunctionsOnly || undefined
              }
            })

            const items = res.items.map(convertFunctionToGraphQLReturn)

            return {
              cursor: res.cursor,
              totalCount: res.totalCount,
              items
            }
          } catch (e) {
            const isNotFound =
              e instanceof ExecutionEngineFailedResponseError &&
              e.response.statusMessage === 'FunctionNotFound'
            if (e instanceof ExecutionEngineNetworkError || isNotFound) {
              return {
                cursor: null,
                totalCount: 0,
                items: []
              }
            }
            throw e
          }
        }
      },
      User: {
        automateInfo: async (parent, _args, ctx) => {
          const userId = parent.id

          let hasAutomateGithubApp = false
          try {
            const authState = await getUserGithubAuthState({ userId })
            hasAutomateGithubApp = authState.userHasAuthorizedGitHubApp
          } catch (e) {
            if (e instanceof ExecutionEngineFailedResponseError) {
              if (e.response.statusMessage === 'FunctionCreatorDoesNotExist') {
                hasAutomateGithubApp = false
              }
            } else {
              ctx.log.error(e, 'Failed to resolve user automate github auth state')
            }
          }

          return {
            hasAutomateGithubApp,
            availableGithubOrgs: []
          }
        }
      },
      ServerInfo: {
        // TODO: Needs proper integration w/ Execution engine
        automate: () => ({
          availableFunctionTemplates: functionTemplateRepos.slice()
        })
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
        async automateFunctionRunStatusReport(_parent, { input }) {
          const deps: ReportFunctionRunStatusDeps = {
            getAutomationFunctionRunRecord: getFunctionRun,
            upsertAutomationFunctionRunRecord: upsertAutomationFunctionRun,
            automationRunUpdater: updateAutomationRun
          }

          const payload = {
            ...input,
            contextView: input.contextView ?? null,
            results: (input.results as Automate.AutomateTypes.ResultsSchema) ?? null,
            runId: input.functionRunId,
            status: mapGqlStatusToDbStatus(input.status),
            statusMessage: input.statusMessage ?? null
          }

          const result = await reportFunctionRunStatus(deps)(payload)

          return result
        },
        automateMutations: () => ({})
      },
      Subscription: {
        projectTriggeredAutomationsStatusUpdated: {
          subscribe: filteredSubscribe(
            ProjectSubscriptions.ProjectTriggeredAutomationsStatusUpdated,
            async (payload, args, ctx) => {
              if (payload.projectId !== args.projectId) return false

              await authorizeResolver(
                ctx.userId,
                payload.projectId,
                Roles.Stream.Owner,
                ctx.resourceAccessRules
              )
              return true
            }
          )
        },
        projectAutomationsUpdated: {
          subscribe: filteredSubscribe(
            ProjectSubscriptions.ProjectAutomationsUpdated,
            async (payload, args, ctx) => {
              if (payload.projectId !== args.projectId) return false

              await authorizeResolver(
                ctx.userId,
                payload.projectId,
                Roles.Stream.Owner,
                ctx.resourceAccessRules
              )
              return true
            }
          )
        }
      }
    }
  : {
      /**
       * If automate module is disabled
       */
      Project: {
        automation: () => {
          throw new AutomateApiDisabledError()
        },
        automations: () => {
          throw new AutomateApiDisabledError()
        }
      },
      AutomateMutations: {
        createFunction: () => {
          throw new AutomateApiDisabledError()
        },
        updateFunction: () => {
          throw new AutomateApiDisabledError()
        }
      },
      ProjectAutomationMutations: {
        create: () => {
          throw new AutomateApiDisabledError()
        },
        update: () => {
          throw new AutomateApiDisabledError()
        },
        createRevision: () => {
          throw new AutomateApiDisabledError()
        },
        trigger: () => {
          throw new AutomateApiDisabledError()
        }
      },
      Query: {
        automateValidateAuthCode: () => {
          throw new AutomateApiDisabledError()
        },
        automateFunction: () => {
          throw new AutomateApiDisabledError()
        },
        automateFunctions: () => {
          throw new AutomateApiDisabledError()
        }
      },
      User: {
        automateInfo: () => ({
          hasAutomateGithubApp: false,
          availableGithubOrgs: []
        })
      },
      ServerInfo: {
        automate: () => ({
          availableFunctionTemplates: []
        })
      },
      Mutation: {
        automateFunctionRunStatusReport: () => {
          throw new AutomateApiDisabledError()
        },
        automateMutations: () => ({})
      },
      Subscription: {
        projectTriggeredAutomationsStatusUpdated: {
          subscribe: filteredSubscribe(
            ProjectSubscriptions.ProjectTriggeredAutomationsStatusUpdated,
            () => false
          )
        },
        projectAutomationsUpdated: {
          subscribe: filteredSubscribe(
            ProjectSubscriptions.ProjectAutomationsUpdated,
            () => false
          )
        }
      }
    }) as Resolvers
