import {
  createFunction,
  triggerAutomationRun,
  updateFunction as execEngineUpdateFunction,
  getFunction,
  getFunctionRelease,
  getFunctions,
  getFunctionReleases,
  getUserGithubAuthState,
  getUserGithubOrganizations
} from '@/modules/automate/clients/executionEngine'
import {
  GetProjectAutomationsParams,
  getAutomationFactory,
  getAutomationRunsItemsFactory,
  getAutomationRunsTotalCountFactory,
  getAutomationTokenFactory,
  getAutomationTriggerDefinitionsFactory,
  getFullAutomationRevisionMetadataFactory,
  getFunctionRunFactory,
  getLatestAutomationRevisionFactory,
  getLatestVersionAutomationRunsFactory,
  getProjectAutomationsItemsFactory,
  getProjectAutomationsTotalCountFactory,
  storeAutomationFactory,
  storeAutomationRevisionFactory,
  storeAutomationTokenFactory,
  updateAutomationFactory,
  updateAutomationRunFactory,
  upsertAutomationFunctionRunFactory,
  upsertAutomationRunFactory
} from '@/modules/automate/repositories/automations'
import {
  createAutomationFactory,
  createAutomationRevisionFactory,
  createTestAutomationFactory,
  getAutomationsStatusFactory,
  validateAndUpdateAutomationFactory
} from '@/modules/automate/services/automationManagement'
import {
  AuthCodePayloadAction,
  createStoredAuthCodeFactory,
  validateStoredAuthCodeFactory
} from '@/modules/automate/services/authCode'
import {
  convertFunctionReleaseToGraphQLReturn,
  convertFunctionToGraphQLReturn,
  createFunctionFromTemplateFactory,
  updateFunctionFactory
} from '@/modules/automate/services/functionManagement'
import {
  Resolvers,
  AutomateRunTriggerType
} from '@/modules/core/graph/generated/graphql'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { createAutomation as clientCreateAutomation } from '@/modules/automate/clients/executionEngine'
import { Automate, Roles, isNullOrUndefined, isNonNullable } from '@speckle/shared'
import { getFeatureFlags, getServerOrigin } from '@/modules/shared/helpers/envHelper'
import {
  getBranchesByIdsFactory,
  getBranchLatestCommitsFactory
} from '@/modules/core/repositories/branches'
import {
  createTestAutomationRunFactory,
  manuallyTriggerAutomationFactory,
  triggerAutomationRevisionRunFactory
} from '@/modules/automate/services/trigger'
import {
  reportFunctionRunStatusFactory,
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
  getFunctionInputDecryptorFactory,
  getFunctionInputsForFrontendFactory
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
import { db } from '@/db/knex'
import { AutomationsEmitter } from '@/modules/automate/events/automations'
import { AutomateRunsEmitter } from '@/modules/automate/events/runs'
import { getCommitFactory } from '@/modules/core/repositories/commits'
import { validateStreamAccessFactory } from '@/modules/core/services/streams/access'
import { getUserFactory } from '@/modules/core/repositories/users'
import { createAppTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory,
  storeUserServerAppTokenFactory
} from '@/modules/core/repositories/tokens'

const { FF_AUTOMATE_MODULE_ENABLED } = getFeatureFlags()

const getUser = getUserFactory({ db })
const storeAutomation = storeAutomationFactory({ db })
const storeAutomationToken = storeAutomationTokenFactory({ db })
const storeAutomationRevision = storeAutomationRevisionFactory({ db })
const getAutomation = getAutomationFactory({ db })
const updateDbAutomation = updateAutomationFactory({ db })
const getLatestVersionAutomationRuns = getLatestVersionAutomationRunsFactory({ db })
const getFunctionRun = getFunctionRunFactory({ db })
const upsertAutomationFunctionRun = upsertAutomationFunctionRunFactory({ db })
const getFullAutomationRevisionMetadata = getFullAutomationRevisionMetadataFactory({
  db
})
const getAutomationToken = getAutomationTokenFactory({ db })
const upsertAutomationRun = upsertAutomationRunFactory({ db })
const getAutomationTriggerDefinitions = getAutomationTriggerDefinitionsFactory({ db })
const getLatestAutomationRevision = getLatestAutomationRevisionFactory({ db })
const updateAutomationRun = updateAutomationRunFactory({ db })

const getAutomationRunsTotalCount = getAutomationRunsTotalCountFactory({ db })
const getAutomationRunsItems = getAutomationRunsItemsFactory({ db })

const getProjectAutomationsItems = getProjectAutomationsItemsFactory({ db })
const getProjectAutomationsTotalCount = getProjectAutomationsTotalCountFactory({ db })
const getBranchLatestCommits = getBranchLatestCommitsFactory({ db })
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const createAppToken = createAppTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storeUserServerAppToken: storeUserServerAppTokenFactory({ db })
})

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
          const getStatus = getAutomationsStatusFactory({
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
          const getStatus = getAutomationsStatusFactory({
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
            ctx.userId,
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
          const prepareInputs = getFunctionInputsForFrontendFactory({
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
                      versionsFilter: args.filter?.search || undefined,
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
        },
        async creator(parent, _args, ctx) {
          if (
            !parent.functionCreator ||
            parent.functionCreator.speckleServerOrigin !== getServerOrigin()
          ) {
            return null
          }

          return ctx.loaders.users.getUser.load(parent.functionCreator.speckleUserId)
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
          const create = createFunctionFromTemplateFactory({
            createExecutionEngineFn: createFunction,
            getUser,
            createStoredAuthCode: createStoredAuthCodeFactory({
              redis: getGenericRedis()
            })
          })

          return (await create({ input: args.input, userId: ctx.userId! }))
            .graphqlReturn
        },
        async updateFunction(_parent, args, ctx) {
          const update = updateFunctionFactory({
            updateFunction: execEngineUpdateFunction,
            getFunction,
            createStoredAuthCode: createStoredAuthCodeFactory({
              redis: getGenericRedis()
            })
          })
          return await update({ input: args.input, userId: ctx.userId! })
        }
      },
      ProjectAutomationMutations: {
        async create(parent, { input }, ctx) {
          const create = createAutomationFactory({
            createAuthCode: createStoredAuthCodeFactory({ redis: getGenericRedis() }),
            automateCreateAutomation: clientCreateAutomation,
            storeAutomation,
            storeAutomationToken,
            validateStreamAccess,
            automationsEventsEmit: AutomationsEmitter.emit
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
          const update = validateAndUpdateAutomationFactory({
            getAutomation,
            updateAutomation: updateDbAutomation,
            validateStreamAccess,
            automationsEventsEmit: AutomationsEmitter.emit
          })

          return await update({
            input,
            userId: ctx.userId!,
            projectId: parent.projectId,
            userResourceAccessRules: ctx.resourceAccessRules
          })
        },
        async createRevision(parent, { input }, ctx) {
          const create = createAutomationRevisionFactory({
            getAutomation,
            storeAutomationRevision,
            getBranchesByIds: getBranchesByIdsFactory({ db }),
            getFunctionRelease,
            getEncryptionKeyPair,
            getFunctionInputDecryptor: getFunctionInputDecryptorFactory({
              buildDecryptor
            }),
            getFunctionReleases,
            automationsEventsEmit: AutomationsEmitter.emit,
            validateStreamAccess
          })

          return await create({
            input,
            projectId: parent.projectId,
            userId: ctx.userId!,
            userResourceAccessRules: ctx.resourceAccessRules
          })
        },
        async trigger(parent, { automationId }, ctx) {
          const trigger = manuallyTriggerAutomationFactory({
            getAutomationTriggerDefinitions,
            getAutomation,
            getBranchLatestCommits,
            triggerFunction: triggerAutomationRevisionRunFactory({
              automateRunTrigger: triggerAutomationRun,
              getEncryptionKeyPairFor,
              getFunctionInputDecryptor: getFunctionInputDecryptorFactory({
                buildDecryptor
              }),
              createAppToken,
              automateRunsEmitter: AutomateRunsEmitter.emit,
              getAutomationToken,
              upsertAutomationRun,
              getFullAutomationRevisionMetadata,
              getBranchLatestCommits,
              getCommit: getCommitFactory({ db })
            }),
            validateStreamAccess
          })

          const { automationRunId } = await trigger({
            automationId,
            userId: ctx.userId!,
            userResourceAccessRules: ctx.resourceAccessRules,
            projectId: parent.projectId
          })

          return automationRunId
        },
        async createTestAutomation(parent, { input }, ctx) {
          const create = createTestAutomationFactory({
            getEncryptionKeyPair,
            getFunction,
            storeAutomation,
            storeAutomationRevision,
            validateStreamAccess,
            automationsEventsEmit: AutomationsEmitter.emit
          })

          return await create({
            input,
            projectId: parent.projectId,
            userId: ctx.userId!,
            userResourceAccessRules: ctx.resourceAccessRules
          })
        },
        async createTestAutomationRun(parent, { automationId }, ctx) {
          const create = createTestAutomationRunFactory({
            getEncryptionKeyPairFor,
            getFunctionInputDecryptor: getFunctionInputDecryptorFactory({
              buildDecryptor
            }),
            getAutomation,
            getLatestAutomationRevision,
            getFullAutomationRevisionMetadata,
            upsertAutomationRun,
            getBranchLatestCommits,
            validateStreamAccess
          })

          return await create({
            projectId: parent.projectId,
            automationId,
            userId: ctx.userId!
          })
        }
      },
      Query: {
        async automateValidateAuthCode(_parent, args) {
          const validate = validateStoredAuthCodeFactory({
            redis: getGenericRedis()
          })
          return await validate({
            ...args.payload,
            action: args.payload.action as AuthCodePayloadAction
          })
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
        automateInfo: (parent) => ({ userId: parent.id })
      },
      UserAutomateInfo: {
        hasAutomateGithubApp: async (parent, _args, ctx) => {
          const userId = parent.userId

          let hasAutomateGithubApp = false
          try {
            const authState = await getUserGithubAuthState({ userId })
            hasAutomateGithubApp = authState.userHasAuthorizedGitHubApp
          } catch (e) {
            ctx.log.error(e, 'Failed to resolve user automate github auth state')
          }

          return hasAutomateGithubApp
        },
        availableGithubOrgs: async (parent, _args, ctx) => {
          const userId = parent.userId
          const authCode = await createStoredAuthCodeFactory({
            redis: getGenericRedis()
          })({
            userId,
            action: AuthCodePayloadAction.GetAvailableGithubOrganizations
          })

          let orgs: string[] = []
          try {
            orgs = (
              await getUserGithubOrganizations({
                authCode
              })
            ).availableGitHubOrganisations
          } catch (e) {
            let isSeriousError = true

            if (e instanceof ExecutionEngineFailedResponseError) {
              if (e.response.statusMessage === 'InvalidOrMissingGithubAuth') {
                isSeriousError = false
              }
            }

            if (isSeriousError) {
              ctx.log.error(e, 'Failed to resolve user automate github orgs')
            }
          }

          return orgs
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
            ctx.userId,
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
            automationRunUpdater: updateAutomationRun,
            runEventEmit: AutomateRunsEmitter.emit
          }

          const payload = {
            ...input,
            contextView: input.contextView ?? null,
            results: (input.results as Automate.AutomateTypes.ResultsSchema) ?? null,
            runId: input.functionRunId,
            status: mapGqlStatusToDbStatus(input.status),
            statusMessage: input.statusMessage ?? null
          }

          const result = await reportFunctionRunStatusFactory(deps)(payload)

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
        automateInfo: () => {
          throw new AutomateApiDisabledError()
        }
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
