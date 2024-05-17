/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AutomateRunStatus,
  LimitedUser,
  Resolvers
} from '@/modules/core/graph/generated/graphql'
import { isTestEnv } from '@/modules/shared/helpers/envHelper'
import { Automate, Roles, SourceAppNames, isNullOrUndefined } from '@speckle/shared'
import { times } from 'lodash'
import { IMockStore, IMocks } from '@graphql-tools/mock'
import dayjs from 'dayjs'
import { BranchCommits, Branches, Commits } from '@/modules/core/dbSchema'
import {
  AutomationNotFoundError,
  FunctionNotFoundError
} from '@/modules/automate/errors/management'
import { functionTemplateRepos } from '@/modules/automate/helpers/executionEngine'
import {
  AutomationRevisionTriggerDefinitionGraphQLReturn,
  AutomationRunTriggerGraphQLReturn
} from '@/modules/automate/helpers/graphTypes'
import { VersionCreationTriggerType } from '@/modules/automate/helpers/types'

const getRandomModelVersion = async (offset?: number) => {
  const versionQ = Commits.knex()
    .join(BranchCommits.name, BranchCommits.col.commitId, Commits.col.id)
    .first()
  if (offset) versionQ.offset(offset)
  const version = await versionQ

  if (!version) {
    throw new Error("Couldn't find even one commit in the DB, please create some")
  }

  const model = await Branches.knex()
    .join(BranchCommits.name, BranchCommits.col.branchId, Branches.col.id)
    .where(BranchCommits.col.commitId, version.id)
    .first()

  if (!model) {
    throw new Error(
      `Couldn't find branch for first commit #${version.id}, please create one `
    )
  }

  return {
    model,
    version
  }
}

/**
 * Define mocking config in dev env
 * https://www.apollographql.com/docs/apollo-server/v3/testing/mocking
 */
export async function buildMocksConfig(): Promise<{
  mocks: boolean | IMocks
  mockEntireSchema: boolean
  resolvers?: Resolvers | ((store: IMockStore) => Resolvers)
}> {
  return { mocks: false, mockEntireSchema: false }

  // TODO: Disable before merging!
  if (isTestEnv()) return { mocks: false, mockEntireSchema: false }

  // const isDebugEnv = isDevEnv()
  // if (!isDebugEnv) return { mocks: false, mockEntireSchema: false } // we def don't want this on in prod

  // feel free to define mocks for your dev env below
  const { faker } = await import('@faker-js/faker')

  return {
    resolvers: (store) => ({
      AutomationRevisionTriggerDefinition: {
        __resolveType: () => 'VersionCreatedTriggerDefinition'
      },
      AutomationRunTrigger: {
        __resolveType: () => 'VersionCreatedTrigger'
      },
      VersionCreatedTriggerDefinition: {
        model: store.get('Model') as any
      },
      VersionCreatedTrigger: {
        model: store.get('Model') as any,
        version: store.get('Version') as any
      },
      Query: {
        automateFunctions: (_parent, args) => {
          const forceZero = false
          const count = forceZero ? 0 : faker.datatype.number({ min: 0, max: 20 })

          const isFeatured = args.filter?.featuredFunctionsOnly

          return {
            cursor: null,
            totalCount: count,
            items: times(count, () => store.get('AutomateFunction', { isFeatured }))
          } as any
        },
        automateFunction: (_parent, args) => {
          const id = args.id
          if (id === '404') {
            throw new FunctionNotFoundError()
          }

          return store.get('AutomateFunction', { id }) as any
        }
      },
      Project: {
        automations: () => {
          const forceAutomations = false
          const forceNoAutomations = false

          const limit = faker.datatype.number({ min: 0, max: 20 })
          let count
          if (forceNoAutomations) {
            count = 0
          } else {
            count = forceAutomations ? limit : faker.datatype.boolean() ? limit : 0
          }

          return {
            cursor: null,
            totalCount: count,
            items: times(count, () => store.get('Automation'))
          } as any
        },
        automation: (_parent, args) => {
          if (args.id === '404') {
            throw new AutomationNotFoundError()
          }

          return store.get('Automation', { id: args.id }) as any
        },
        blob: () => {
          return store.get('BlobMetadata') as any
        }
      },
      Model: {
        automationsStatus: async () => {
          const random = faker.datatype.boolean()
          return (random ? store.get('TriggeredAutomationsStatus') : null) as any
        }
      },
      Version: {
        automationsStatus: async () => {
          const random = faker.datatype.boolean()
          return (random ? store.get('TriggeredAutomationsStatus') : null) as any
        }
      },
      Automation: {
        creationPublicKeys: () => {
          // Random sized array of string keys
          return [...new Array(faker.datatype.number({ min: 0, max: 5 }))].map(() =>
            faker.datatype.uuid()
          )
        },
        runs: () => {
          const forceZero = false
          const count = forceZero ? 0 : faker.datatype.number({ min: 0, max: 20 })

          return {
            cursor: null,
            totalCount: count,
            items: times(count, () => store.get('AutomateRun'))
          } as any
        },
        currentRevision: () => store.get('AutomationRevision') as any
      },
      AutomationRevision: {
        triggerDefinitions: async (parent) => {
          const rand = faker.datatype.number({ min: 0, max: 2 })
          const res = (
            await Promise.all([getRandomModelVersion(), getRandomModelVersion(1)])
          ).slice(0, rand)

          return res.map(
            (i): AutomationRevisionTriggerDefinitionGraphQLReturn => ({
              triggerType: VersionCreationTriggerType,
              triggeringId: i.model.id,
              automationRevisionId: parent.id
            })
          )
        },
        functions: () => [store.get('AutomateFunction') as any]
      },
      AutomationRevisionFunction: {
        parameters: () => ({}),
        release: () => store.get('AutomateFunctionRelease') as any
      },
      AutomateRun: {
        trigger: async (parent) => {
          const { version } = await getRandomModelVersion()

          return <AutomationRunTriggerGraphQLReturn>{
            triggerType: VersionCreationTriggerType,
            triggeringId: version.id,
            automationRunId: parent.id
          }
        },
        automation: () => store.get('Automation') as any,
        status: () => faker.helpers.arrayElement(Object.values(AutomateRunStatus))
      },
      AutomateFunctionRun: {
        function: () => store.get('AutomateFunction') as any,
        status: () => faker.helpers.arrayElement(Object.values(AutomateRunStatus))
      },
      ProjectAutomationMutations: {
        create: (_parent, args) => {
          const {
            input: { name, enabled }
          } = args
          const automation = store.get('Automation') as any
          return {
            ...automation,
            name,
            enabled
          }
        },
        update: (_parent, args) => {
          const {
            input: { id, name, enabled }
          } = args
          const automation = store.get('Automation') as any
          return {
            ...automation,
            id,
            ...(name?.length ? { name } : {}),
            ...(isNullOrUndefined(enabled) ? {} : { enabled })
          }
        },
        trigger: () => true,
        createRevision: () => store.get('AutomationRevision') as any
      },
      UserAutomateInfo: {
        hasAutomateGithubApp: () => {
          return faker.datatype.boolean()
        },
        availableGithubOrgs: () => {
          // Random string array
          return [...new Array(faker.datatype.number({ min: 0, max: 5 }))].map(() =>
            faker.company.companyName()
          )
        }
      },
      AutomateFunction: {
        // creator: async (_parent, args, ctx) => {
        //   const rand = faker.datatype.boolean()
        //   const activeUser = ctx.userId
        //     ? await ctx.loaders.users.getUser.load(ctx.userId)
        //     : null

        //   return rand ? (store.get('LimitedUser') as any) : activeUser
        // }
        releases: () => store.get('AutomateFunctionReleaseCollection') as any,
        automationCount: () => faker.datatype.number({ min: 0, max: 99 })
      },
      AutomateFunctionRelease: {
        function: () => store.get('AutomateFunction') as any
      },
      TriggeredAutomationsStatus: {
        status: () => faker.helpers.arrayElement(Object.values(AutomateRunStatus))
      },
      AutomateMutations: {
        createFunction: () => store.get('AutomateFunction') as any,
        updateFunction: (_parent, args) => {
          const {
            input: { id, name, description, supportedSourceApps, tags }
          } = args
          const func = store.get('AutomateFunction', { id }) as any
          return {
            ...func,
            id,
            ...(name?.length ? { name } : {}),
            ...(description?.length ? { description } : {}),
            ...(supportedSourceApps?.length ? { supportedSourceApps } : {}),
            ...(tags?.length ? { tags } : {})
          }
        }
      }
    }),
    mocks: {
      BlobMetadata: () => ({
        fileName: () => faker.system.fileName(),
        fileType: () => faker.system.mimeType(),
        fileSize: () => faker.datatype.number({ min: 1, max: 1000 })
      }),
      TriggeredAutomationsStatus: () => ({
        automationRuns: () => [...new Array(faker.datatype.number({ min: 1, max: 5 }))]
      }),
      AutomationRevision: () => ({
        functions: () => [undefined] // array of 1 always,
      }),
      Automation: () => ({
        name: () => faker.company.companyName(),
        enabled: () => faker.datatype.boolean()
      }),
      AutomateFunction: () => ({
        name: () => faker.commerce.productName(),
        isFeatured: () => faker.datatype.boolean(),
        logo: () => {
          const random = faker.datatype.boolean()
          return random
            ? faker.image.imageUrl(undefined, undefined, undefined, true)
            : null
        },
        repoUrl: () =>
          'https://github.com/specklesystems/speckle-automate-code-compliance-window-safety',
        automationCount: () => faker.datatype.number({ min: 0, max: 99 }),
        description: () => {
          // Example markdown description
          return `# ${faker.commerce.productName()}\n${faker.lorem.paragraphs(
            1,
            '\n\n'
          )}\n## Features \n- ${faker.lorem.sentence()}\n - ${faker.lorem.sentence()}\n - ${faker.lorem.sentence()}`
        },
        supportedSourceApps: () => {
          const base = SourceAppNames

          // Random assortment from base
          return base.filter(faker.datatype.boolean)
        },
        tags: () => {
          // Random string array
          return [...new Array(faker.datatype.number({ min: 0, max: 5 }))].map(() =>
            faker.lorem.word()
          )
        }
      }),
      AutomateFunctionRelease: () => ({
        versionTag: () => {
          // Fake semantic version
          return `${faker.datatype.number({ min: 0, max: 9 })}.${faker.datatype.number({
            min: 0,
            max: 9
          })}.${faker.datatype.number({ min: 0, max: 9 })}`
        },
        commitId: () => '0c259d384a4df3cce3f24667560e5124e68f202f',
        inputSchema: () => {
          // random fro 1 to 3
          const rand = faker.datatype.number({ min: 1, max: 3 })
          switch (rand) {
            case 1:
              return {
                $schema: 'https://json-schema.org/draft/2020-12/schema',
                $id: 'https://example.com/product.schema.json',
                title: 'Product',
                description: "A product from Acme's catalog",
                type: 'object',
                properties: {
                  name: {
                    desciption: 'Random name',
                    type: 'string'
                  },
                  productId: {
                    description: 'The unique identifier for a product',
                    type: 'integer'
                  }
                },
                required: ['productId']
              }
            default:
              return null
          }
        }
      }),
      AutomateRun: () => ({
        reason: () => faker.lorem.sentence(),
        id: () => faker.random.alphaNumeric(20),
        createdAt: () =>
          faker.date
            .recent(undefined, dayjs().subtract(1, 'day').toDate())
            .toISOString(),
        updatedAt: () => faker.date.recent().toISOString(),
        functionRuns: () => [...new Array(faker.datatype.number({ min: 1, max: 5 }))],
        statusMessage: () => faker.lorem.sentence()
      }),
      AutomateFunctionRun: () => ({
        contextView: () => `/`,
        elapsed: () => faker.datatype.number({ min: 0, max: 600 }),
        statusMessage: () => faker.lorem.sentence(),
        results: (): Automate.AutomateTypes.ResultsSchema => {
          return {
            version: Automate.AutomateTypes.RESULTS_SCHEMA_VERSION,
            values: {
              objectResults: [],
              blobIds: [...new Array(faker.datatype.number({ min: 0, max: 5 }))].map(
                () => faker.datatype.uuid()
              )
            }
          }
        }
      }),
      LimitedUser: () =>
        ({
          id: faker.datatype.uuid(),
          name: faker.name.findName(),
          avatar: faker.image.avatar(),
          bio: faker.lorem.sentence(),
          company: faker.company.companyName(),
          verified: faker.datatype.boolean(),
          role: Roles.Server.User
        } as LimitedUser),
      JSONObject: () => ({}),
      ID: () => faker.datatype.uuid(),
      DateTime: () => faker.date.recent().toISOString(),
      Model: () => ({
        id: () => faker.datatype.uuid(),
        name: () => faker.commerce.productName(),
        previewUrl: () => faker.image.imageUrl()
      }),
      Version: () => ({
        id: () => faker.random.alphaNumeric(10)
      }),
      ServerAutomateInfo: () => ({
        availableFunctionTemplates: () => functionTemplateRepos
      })
    },
    mockEntireSchema: false
  }
}

export type AppMocksConfig = Awaited<ReturnType<typeof buildMocksConfig>>
