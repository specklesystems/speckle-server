import {
  createFunction,
  createFunctionWithoutVersion,
  triggerAutomationRun,
  updateFunction as execEngineUpdateFunction,
  getFunctionFactory,
  getFunctionReleaseFactory,
  getFunctionReleasesFactory,
  getUserGithubAuthState,
  getUserGithubOrganizations,
  getUserFunctionsFactory,
  regenerateFunctionToken
} from '@/modules/automate/clients/executionEngine'
import type { GetProjectAutomationsParams } from '@/modules/automate/repositories/automations'
import {
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
  upsertAutomationRunFactory,
  markAutomationDeletedFactory
} from '@/modules/automate/repositories/automations'
import {
  createAutomationFactory,
  createAutomationRevisionFactory,
  createTestAutomationFactory,
  getAutomationsStatusFactory,
  validateAndUpdateAutomationFactory,
  deleteAutomationFactory
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
  regenerateFunctionTokenFactory,
  updateFunctionFactory
} from '@/modules/automate/services/functionManagement'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { AutomateRunTriggerType } from '@/modules/core/graph/generated/graphql'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { createAutomation as clientCreateAutomation } from '@/modules/automate/clients/executionEngine'
import {
  Automate,
  Roles,
  isNullOrUndefined,
  isNonNullable,
  removeNullOrUndefinedKeys
} from '@speckle/shared'
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
import { reportFunctionRunStatusFactory } from '@/modules/automate/services/runsManagement'
import {
  AutomationNotFoundError,
  FunctionNotFoundError
} from '@/modules/automate/errors/management'
import type { FunctionReleaseSchemaType } from '@/modules/automate/helpers/executionEngine'
import {
  dbToGraphqlTriggerTypeMap,
  functionTemplateRepos
} from '@/modules/automate/helpers/executionEngine'
import { authorizeResolver } from '@/modules/shared'
import type { AutomationRevisionFunctionForInputRedaction } from '@/modules/automate/services/encryption'
import {
  getEncryptionKeyPair,
  getEncryptionKeyPairFor,
  getEncryptionPublicKey,
  getFunctionInputDecryptorFactory,
  getFunctionInputsForFrontendFactory
} from '@/modules/automate/services/encryption'
import { buildDecryptor } from '@/modules/shared/utils/libsodium'
import * as _ from 'lodash-es'
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
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { BranchNotFoundError } from '@/modules/core/errors/branch'
import { asOperation } from '@/modules/shared/command'
import {
  mapAuthToServerError,
  throwIfAuthNotOk
} from '@/modules/shared/helpers/errorHelper'
import { withOperationLogging } from '@/observability/domain/businessLogging'

const { FF_AUTOMATE_MODULE_ENABLED } = getFeatureFlags()

const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const createAppToken = createAppTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storeUserServerAppToken: storeUserServerAppTokenFactory({ db })
})

export default (FF_AUTOMATE_MODULE_ENABLED
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
          const projectDb = await getProjectDbClient({ projectId: parent.projectId })
          return ctx.loaders
            .forRegion({ db: projectDb })
            .branches.getById.load(parent.triggeringId)
        }
      },
      VersionCreatedTrigger: {
        type: () => AutomateRunTriggerType.VersionCreated,
        async version(parent, _args, ctx) {
          const projectDb = await getProjectDbClient({ projectId: parent.projectId })
          return ctx.loaders
            .forRegion({ db: projectDb })
            .commits.getById.load(parent.triggeringId)
        },
        async model(parent, _args, ctx) {
          const projectDb = await getProjectDbClient({ projectId: parent.projectId })
          return ctx.loaders
            .forRegion({ db: projectDb })
            .commits.getCommitBranch.load(parent.triggeringId)
        }
      },
      ProjectTriggeredAutomationsStatusUpdatedMessage: {
        async project(parent, _args, ctx) {
          const projectDb = await getProjectDbClient({ projectId: parent.projectId })
          return ctx.loaders
            .forRegion({ db: projectDb })
            .streams.getStream.load(parent.projectId)
        },
        async model(parent, _args, ctx) {
          const projectDb = await getProjectDbClient({ projectId: parent.projectId })
          return ctx.loaders
            .forRegion({ db: projectDb })
            .branches.getById.load(parent.modelId)
        },
        async version(parent, _args, ctx) {
          const projectDb = await getProjectDbClient({ projectId: parent.projectId })
          return ctx.loaders
            .forRegion({ db: projectDb })
            .commits.getById.load(parent.versionId)
        }
      },
      Project: {
        async automation(parent, args, ctx) {
          const canReadAutomation = await ctx.authPolicies.project.automation.canRead({
            userId: ctx.userId,
            projectId: parent.id
          })
          if (!canReadAutomation.isOk) {
            throw mapAuthToServerError(canReadAutomation.error)
          }

          const projectDb = await getProjectDbClient({ projectId: parent.id })

          const res = await ctx.loaders
            .forRegion({ db: projectDb })
            .streams.getAutomation.forStream(parent.id)
            .load(args.id)

          if (!res) {
            throw new AutomationNotFoundError()
          }

          return res
        },
        async automations(parent, args, ctx) {
          const canReadAutomation = await ctx.authPolicies.project.automation.canRead({
            userId: ctx.userId,
            projectId: parent.id
          })
          if (!canReadAutomation.isOk) {
            throw mapAuthToServerError(canReadAutomation.error)
          }

          const projectDb = await getProjectDbClient({ projectId: parent.id })

          const retrievalArgs: GetProjectAutomationsParams = {
            projectId: parent.id,
            args
          }

          const [{ items, cursor }, totalCount] = await Promise.all([
            getProjectAutomationsItemsFactory({ db: projectDb })(retrievalArgs),
            getProjectAutomationsTotalCountFactory({ db: projectDb })(retrievalArgs)
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
          const projectDb = await getProjectDbClient({ projectId: parent.streamId })

          const getStatus = getAutomationsStatusFactory({
            getLatestVersionAutomationRuns: getLatestVersionAutomationRunsFactory({
              db: projectDb
            })
          })

          const modelId = parent.id
          const projectId = parent.streamId
          const latestCommit = await ctx.loaders
            .forRegion({ db: projectDb })
            .branches.getLatestCommit.load(parent.id)

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
          const projectDb = await getProjectDbClient({ projectId: parent.streamId })

          const getStatus = getAutomationsStatusFactory({
            getLatestVersionAutomationRuns: getLatestVersionAutomationRunsFactory({
              db: projectDb
            })
          })

          const versionId = parent.id
          const branch = await ctx.loaders
            .forRegion({ db: projectDb })
            .commits.getCommitBranch.load(versionId)
          if (!branch) throw new BranchNotFoundError('Invalid version Id')

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
          const projectDb = await getProjectDbClient({ projectId: parent.projectId })
          const automationRevision = await ctx.loaders
            .forRegion({ db: projectDb })
            .automations.getLatestAutomationRevision.load(parent.id)
          return automationRevision
            ? { ...automationRevision, projectId: parent.projectId }
            : null
        },
        async runs(parent, args) {
          const projectDb = await getProjectDbClient({ projectId: parent.projectId })

          const retrievalArgs = {
            automationId: parent.id,
            ...args
          }

          const [{ items, cursor }, totalCount] = await Promise.all([
            getAutomationRunsItemsFactory({ db: projectDb })({
              args: retrievalArgs
            }),
            getAutomationRunsTotalCountFactory({ db: projectDb })({
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
            Roles.Stream.Contributor,
            ctx.resourceAccessRules
          )

          const publicKey = await getEncryptionPublicKey()
          return [publicKey]
        }
      },
      AutomateRun: {
        async trigger(parent, _args, ctx) {
          const projectDb = await getProjectDbClient({ projectId: parent.projectId })

          const triggers =
            parent.triggers ||
            (await ctx.loaders
              .forRegion({ db: projectDb })
              .automations.getRunTriggers.load(parent.id))

          const trigger = triggers[0]
          return { ...trigger, projectId: parent.projectId }
        },
        async functionRuns(parent) {
          return parent.functionRuns
        },
        async automation(parent, _args, ctx) {
          const projectDb = await getProjectDbClient({ projectId: parent.projectId })

          return ctx.loaders
            .forRegion({ db: projectDb })
            .automations.getAutomation.load(parent.automationId)
        },
        status: (parent) => mapDbStatusToGqlStatus(parent.status)
      },
      TriggeredAutomationsStatus: {
        status: (parent) => mapDbStatusToGqlStatus(parent.status)
      },
      AutomateFunctionRun: {
        async function(parent, _args, ctx) {
          if (!parent.functionId) {
            return null
          }
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
          return null
        },
        status: (parent) => mapDbStatusToGqlStatus(parent.status)
      },
      AutomationRevision: {
        async triggerDefinitions(parent, _args, ctx) {
          const projectDb = await getProjectDbClient({ projectId: parent.projectId })

          const triggers = await ctx.loaders
            .forRegion({ db: projectDb })
            .automations.getRevisionTriggerDefinitions.load(parent.id)

          return triggers.map((trigger) => ({
            ...trigger,
            projectId: parent.projectId
          }))
        },
        async functions(parent, _args, ctx) {
          const projectDb = await getProjectDbClient({ projectId: parent.projectId })

          const prepareInputs = getFunctionInputsForFrontendFactory({
            getEncryptionKeyPairFor,
            buildDecryptor,
            redactWriteOnlyInputData
          })

          const fns = await ctx.loaders
            .forRegion({ db: projectDb })
            .automations.getRevisionFunctions.load(parent.id)
          const fnsReleases = _.keyBy(
            (
              await ctx.loaders
                .forRegion({ db: projectDb })
                .automationsApi.getFunctionRelease.loadMany(
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
        async releases(parent, args, context) {
          try {
            // TODO: Replace w/ dataloader batch call, when/if possible
            const fn = await getFunctionFactory({
              logger: context.log
            })({
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

            if (!fn) {
              return {
                cursor: null,
                totalCount: 0,
                items: []
              }
            }

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
          if (!parent.functionId) {
            return null
          }
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
          const logger = ctx.log
          const create = createFunctionFromTemplateFactory({
            createExecutionEngineFn: createFunction,
            getUser: getUserFactory({ db }),
            createStoredAuthCode: createStoredAuthCodeFactory({
              redis: getGenericRedis()
            }),
            logger
          })

          const { graphqlReturn } = await withOperationLogging(
            async () => await create({ input: args.input, userId: ctx.userId! }),
            {
              logger,
              operationName: 'createFunction',
              operationDescription: 'Create a new Automate function'
            }
          )
          return graphqlReturn
        },
        async createFunctionWithoutVersion(_parent, args, ctx) {
          const logger = ctx.log

          const authCode = await createStoredAuthCodeFactory({
            redis: getGenericRedis()
          })({
            userId: ctx.userId!,
            action: AuthCodePayloadAction.CreateFunction
          })
          return await withOperationLogging(
            async () =>
              await createFunctionWithoutVersion({
                body: {
                  speckleServerAuthenticationPayload: {
                    ...authCode,
                    origin: getServerOrigin()
                  },
                  functionName: args.input.name,
                  description: args.input.description,
                  repositoryUrl:
                    'https://github.com/specklesystems/speckle_automate_python_example',
                  supportedSourceApps: [],
                  tags: []
                }
              }),
            {
              logger,
              operationName: 'createFunctionWithoutVersion',
              operationDescription: 'Create a new Automate function without version'
            }
          )
        },
        async updateFunction(_parent, args, ctx) {
          const functionId = args.input.id
          const logger = ctx.log.child({
            functionId
          })
          const update = updateFunctionFactory({
            updateFunction: execEngineUpdateFunction,
            getFunction: getFunctionFactory({ logger }),
            createStoredAuthCode: createStoredAuthCodeFactory({
              redis: getGenericRedis()
            })
          })
          return await withOperationLogging(
            async () => await update({ input: args.input, userId: ctx.userId! }),
            {
              logger,
              operationName: 'updateFunction',
              operationDescription: 'Update an Automate function'
            }
          )
        },
        regenerateFunctionToken: async (_parent, args, context) => {
          const { functionId } = args

          const authResult =
            await context.authPolicies.automate.function.canRegenerateToken({
              functionId,
              userId: context.userId
            })
          throwIfAuthNotOk(authResult)

          const logger = context.log.child({
            functionId
          })

          return await regenerateFunctionTokenFactory({
            regenerateFunctionToken,
            getFunction: getFunctionFactory({ logger }),
            createStoredAuthCode: createStoredAuthCodeFactory({
              redis: getGenericRedis()
            })
          })({
            functionId,
            userId: context.userId!
          })
        }
      },
      ProjectAutomationMutations: {
        async create(parent, { input }, ctx) {
          const canCreate = await ctx.authPolicies.project.automation.canCreate({
            userId: ctx.userId,
            projectId: parent.projectId
          })
          if (!canCreate.isOk) {
            throw mapAuthToServerError(canCreate.error)
          }

          const projectId = parent.projectId

          const logger = ctx.log.child({
            projectId,
            streamId: projectId //legacy
          })

          const projectDb = await getProjectDbClient({ projectId })

          const create = createAutomationFactory({
            createAuthCode: createStoredAuthCodeFactory({ redis: getGenericRedis() }),
            automateCreateAutomation: clientCreateAutomation,
            storeAutomation: storeAutomationFactory({ db: projectDb }),
            storeAutomationToken: storeAutomationTokenFactory({ db: projectDb }),
            eventEmit: getEventBus().emit
          })

          const { automation } = await withOperationLogging(
            async () =>
              await create({
                input,
                userId: ctx.userId!,
                projectId,
                userResourceAccessRules: ctx.resourceAccessRules
              }),
            {
              logger,
              operationName: 'createProjectAutomation',
              operationDescription: 'Create a new Automation attached to a project'
            }
          )

          return automation
        },
        async update(parent, { input }, ctx) {
          const canUpdate = await ctx.authPolicies.project.automation.canUpdate({
            userId: ctx.userId,
            projectId: parent.projectId
          })
          if (!canUpdate.isOk) {
            throw mapAuthToServerError(canUpdate.error)
          }

          const projectId = parent.projectId
          const automationId = input.id

          const logger = ctx.log.child({
            projectId,
            streamId: projectId, //legacy
            automationId
          })

          const projectDb = await getProjectDbClient({ projectId })

          const update = validateAndUpdateAutomationFactory({
            getAutomation: getAutomationFactory({ db: projectDb }),
            updateAutomation: updateAutomationFactory({ db: projectDb }),
            eventEmit: getEventBus().emit
          })

          return await withOperationLogging(
            async () =>
              await update({
                input,
                userId: ctx.userId!,
                projectId,
                userResourceAccessRules: ctx.resourceAccessRules
              }),
            {
              logger,
              operationName: 'updateProjectAutomation',
              operationDescription: 'Update an Automation attached to a project'
            }
          )
        },
        async delete(parent, input, context) {
          const canDelete = await context.authPolicies.project.automation.canDelete({
            userId: context.userId,
            projectId: parent.projectId
          })
          throwIfAuthNotOk(canDelete)

          const projectId = parent.projectId
          const automationId = input.automationId

          const logger = context.log.child({
            projectId,
            streamId: projectId, //legacy
            automationId
          })

          const projectDb = await getProjectDbClient({ projectId })

          return await asOperation(
            async ({ db }) => {
              const deleteAutomation = deleteAutomationFactory({
                deleteAutomation: markAutomationDeletedFactory({ db })
              })

              return await deleteAutomation({ automationId })
            },
            {
              logger,
              name: 'deleteProjectAutomation',
              description: 'Delete an Automation attached to a project',
              db: projectDb
            }
          )
        },
        async createRevision(parent, { input }, ctx) {
          const projectId = parent.projectId
          const automationId = input.automationId

          const logger = ctx.log.child({
            projectId,
            streamId: projectId, //legacy
            automationId
          })

          const projectDb = await getProjectDbClient({ projectId })

          const create = createAutomationRevisionFactory({
            getAutomation: getAutomationFactory({ db: projectDb }),
            storeAutomationRevision: storeAutomationRevisionFactory({ db: projectDb }),
            getBranchesByIds: getBranchesByIdsFactory({ db: projectDb }),
            getFunctionRelease: getFunctionReleaseFactory({ logger: ctx.log }),
            getEncryptionKeyPair,
            getFunctionInputDecryptor: getFunctionInputDecryptorFactory({
              buildDecryptor
            }),
            getFunctionReleases: getFunctionReleasesFactory({ logger: ctx.log }),
            eventEmit: getEventBus().emit,
            validateStreamAccess
          })

          return await withOperationLogging(
            async () =>
              await create({
                input,
                projectId,
                userId: ctx.userId!,
                userResourceAccessRules: ctx.resourceAccessRules
              }),
            {
              logger,
              operationName: 'createAutomationRevision',
              operationDescription: 'Create a new Automation revision'
            }
          )
        },
        async trigger(parent, { automationId }, ctx) {
          const projectId = parent.projectId

          const logger = ctx.log.child({
            projectId,
            streamId: projectId, //legacy
            automationId
          })

          const projectDb = await getProjectDbClient({ projectId })

          const trigger = manuallyTriggerAutomationFactory({
            getAutomationTriggerDefinitions: getAutomationTriggerDefinitionsFactory({
              db: projectDb
            }),
            getAutomation: getAutomationFactory({ db: projectDb }),
            getBranchLatestCommits: getBranchLatestCommitsFactory({ db: projectDb }),
            triggerFunction: triggerAutomationRevisionRunFactory({
              automateRunTrigger: triggerAutomationRun,
              getEncryptionKeyPairFor,
              getFunctionInputDecryptor: getFunctionInputDecryptorFactory({
                buildDecryptor
              }),
              createAppToken,
              emitEvent: getEventBus().emit,
              getAutomationToken: getAutomationTokenFactory({ db: projectDb }),
              upsertAutomationRun: upsertAutomationRunFactory({ db: projectDb }),
              getFullAutomationRevisionMetadata:
                getFullAutomationRevisionMetadataFactory({ db: projectDb }),
              getBranchLatestCommits: getBranchLatestCommitsFactory({ db: projectDb }),
              getCommit: getCommitFactory({ db: projectDb })
            }),
            validateStreamAccess
          })

          const { automationRunId } = await withOperationLogging(
            async () =>
              await trigger({
                automationId,
                userId: ctx.userId!,
                userResourceAccessRules: ctx.resourceAccessRules,
                projectId
              }),
            {
              logger,
              operationName: 'triggerProjectAutomation',
              operationDescription: 'Trigger an Automation'
            }
          )

          return automationRunId
        },
        async createTestAutomation(parent, { input }, ctx) {
          const projectId = parent.projectId

          const authResult = await ctx.authPolicies.project.automation.canCreate({
            userId: ctx.userId,
            projectId
          })
          throwIfAuthNotOk(authResult)

          const logger = ctx.log.child({
            projectId,
            streamId: projectId //legacy
          })

          const projectDb = await getProjectDbClient({ projectId })

          const create = createTestAutomationFactory({
            getEncryptionKeyPair,
            storeAutomation: storeAutomationFactory({ db: projectDb }),
            storeAutomationRevision: storeAutomationRevisionFactory({ db: projectDb }),
            validateStreamAccess,
            eventEmit: getEventBus().emit
          })

          return await withOperationLogging(
            async () =>
              await create({
                automationName: input.name,
                modelId: input.modelId,
                projectId,
                userId: ctx.userId!
              }),
            {
              logger,
              operationName: 'createTestAutomation',
              operationDescription: 'Create a new test Automation'
            }
          )
        },
        async createTestAutomationRun(parent, { automationId }, ctx) {
          const projectId = parent.projectId

          const logger = ctx.log.child({
            projectId,
            streamId: projectId, //legacy
            automationId
          })

          const projectDb = await getProjectDbClient({ projectId: parent.projectId })

          const create = createTestAutomationRunFactory({
            getEncryptionKeyPairFor,
            getFunctionInputDecryptor: getFunctionInputDecryptorFactory({
              buildDecryptor
            }),
            getAutomation: getAutomationFactory({
              db: projectDb
            }),
            getLatestAutomationRevision: getLatestAutomationRevisionFactory({
              db: projectDb
            }),
            getFullAutomationRevisionMetadata: getFullAutomationRevisionMetadataFactory(
              {
                db: projectDb
              }
            ),
            upsertAutomationRun: upsertAutomationRunFactory({
              db: projectDb
            }),
            getBranchLatestCommits: getBranchLatestCommitsFactory({
              db: projectDb
            }),
            emitEvent: getEventBus().emit,
            validateStreamAccess
          })

          return await withOperationLogging(
            async () =>
              await create({
                projectId: parent.projectId,
                automationId,
                userId: ctx.userId!
              }),
            {
              logger,
              operationName: 'createTestAutomationRun',
              operationDescription: 'Create a new test Automation run'
            }
          )
        }
      },
      Query: {
        async automateValidateAuthCode(_parent, args, ctx) {
          const validate = validateStoredAuthCodeFactory({
            redis: getGenericRedis(),
            emit: getEventBus().emit,
            logger: ctx.log
          })
          const payload = removeNullOrUndefinedKeys(args.payload)
          const resources = removeNullOrUndefinedKeys(args.resources ?? {})
          return await validate({
            payload: {
              ...payload,
              action: args.payload.action as AuthCodePayloadAction
            },
            resources
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
        }
      },
      User: {
        automateInfo: (parent) => ({ userId: parent.id }),
        automateFunctions: async (_parent, args, context) => {
          try {
            const authCode = await createStoredAuthCodeFactory({
              redis: getGenericRedis()
            })({
              userId: context.userId!,
              action: AuthCodePayloadAction.ListUserFunctions
            })

            const res = await getUserFunctionsFactory({
              logger: context.log
            })({
              userId: context.userId!,
              query: {
                query: args.filter?.search || undefined,
                cursor: args.cursor || undefined,
                limit: isNullOrUndefined(args.limit) ? undefined : args.limit
              },
              body: {
                speckleServerAuthenticationPayload: {
                  ...authCode,
                  origin: getServerOrigin()
                }
              }
            })

            if (!res) {
              return {
                cursor: null,
                totalCount: 0,
                items: []
              }
            }

            const items = res.functions.map(convertFunctionToGraphQLReturn)

            return {
              cursor: undefined,
              totalCount: res.functions.length,
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
            Roles.Stream.Contributor,
            ctx.resourceAccessRules
          )
          return { projectId }
        }
      },
      Mutation: {
        async automateFunctionRunStatusReport(_parent, { input }, ctx) {
          const projectId = input.projectId
          const functionRunId = input.functionRunId
          const logger = ctx.log.child({
            projectId,
            streamId: projectId, //legacy
            functionRunId
          })

          const projectDb = await getProjectDbClient({ projectId: input.projectId })
          const reportFunctionRunStatus = reportFunctionRunStatusFactory({
            getAutomationFunctionRunRecord: getFunctionRunFactory({
              db: projectDb
            }),
            upsertAutomationFunctionRunRecord: upsertAutomationFunctionRunFactory({
              db: projectDb
            }),
            automationRunUpdater: updateAutomationRunFactory({
              db: projectDb
            }),
            emitEvent: getEventBus().emit
          })

          const result = await withOperationLogging(
            async () =>
              await reportFunctionRunStatus({
                ...input,
                contextView: input.contextView ?? null,
                results:
                  (input.results as Automate.AutomateTypes.ResultsSchema) ?? null,
                runId: input.functionRunId,
                status: mapGqlStatusToDbStatus(input.status),
                statusMessage: input.statusMessage ?? null
              }),
            {
              logger,
              operationName: 'automateFunctionRunStatusReport',
              operationDescription: 'Report the status of a function run'
            }
          )

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
