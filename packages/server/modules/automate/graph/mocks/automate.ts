/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AutomationNotFoundError,
  FunctionNotFoundError
} from '@/modules/automate/errors/management'
import { functionTemplateRepos } from '@/modules/automate/helpers/executionEngine'
import type {
  AutomationRevisionTriggerDefinitionGraphQLReturn,
  AutomationRunTriggerGraphQLReturn
} from '@/modules/automate/helpers/graphTypes'
import { VersionCreationTriggerType } from '@/modules/automate/helpers/types'
import { BranchCommits, Branches, Commits } from '@/modules/core/dbSchema'
import { AutomateRunStatus } from '@/modules/core/graph/generated/graphql'
import type { SpeckleModuleMocksConfig } from '@/modules/shared/helpers/mocks'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { faker } from '@faker-js/faker'
import { Automate, isNullOrUndefined, SourceAppNames } from '@speckle/shared'
import dayjs from 'dayjs'
import { times } from 'lodash-es'

const { FF_AUTOMATE_MODULE_ENABLED } = getFeatureFlags()

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

const mocks: SpeckleModuleMocksConfig = FF_AUTOMATE_MODULE_ENABLED
  ? {
      resolvers: ({ store, helpers: { getMockRef, resolveAndCache } }) => ({
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
          automateFunctions: () => {
            const forceZero = false
            const count = forceZero ? 0 : faker.number.int({ min: 0, max: 20 })

            return {
              cursor: null,
              totalCount: count,
              items: times(count, () => store.get('AutomateFunction'))
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
        User: {
          automateFunctions: () => {
            const count = faker.number.int({ min: 0, max: 20 })

            return {
              cursor: null,
              totalCount: count,
              items: times(count, () => store.get('AutomateFunction'))
            } as any
          }
        },
        Workspace: {
          automateFunctions: () => {
            const count = faker.number.int({ min: 0, max: 20 })

            return {
              cursor: null,
              totalCount: count,
              items: times(count, () => store.get('AutomateFunction'))
            } as any
          }
        },
        Project: {
          automations: () => {
            const forceAutomations = false
            const forceNoAutomations = false

            const limit = faker.number.int({ min: 0, max: 20 })
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
            return [...new Array(faker.number.int({ min: 0, max: 5 }))].map(() =>
              faker.string.uuid()
            )
          },
          runs: () => {
            const forceZero = false
            const count = forceZero ? 0 : faker.number.int({ min: 0, max: 20 })

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
            const rand = faker.number.int({ min: 0, max: 2 })
            const res = (
              await Promise.all([getRandomModelVersion(), getRandomModelVersion(1)])
            ).slice(0, rand)

            return res.map(
              (i): AutomationRevisionTriggerDefinitionGraphQLReturn => ({
                triggerType: VersionCreationTriggerType,
                triggeringId: i.model.id,
                automationRevisionId: parent.id,
                projectId: (store.get('Project') as any).id
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
          trigger: () => faker.string.sample(10),
          createRevision: () => store.get('AutomationRevision') as any
        },
        UserAutomateInfo: {
          hasAutomateGithubApp: () => {
            return faker.datatype.boolean()
          },
          availableGithubOrgs: () => {
            // Random string array
            return [...new Array(faker.number.int({ min: 0, max: 5 }))].map(() =>
              faker.company.name()
            )
          }
        },
        AutomateFunction: {
          creator: resolveAndCache((parent, args, ctx) => {
            const rand = faker.datatype.boolean()
            return getMockRef('LimitedUser', { id: !rand ? ctx.userId : undefined })
          }),
          repo: resolveAndCache(() => {
            return {}
          }),
          releases: () => store.get('AutomateFunctionReleaseCollection') as any
        },
        AutomateFunctionPermissionChecks: {
          canRegenerateToken: () => ({
            authorized: faker.datatype.boolean(),
            code: faker.string.alphanumeric(10),
            message: faker.lorem.words(10)
          })
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
        TriggeredAutomationsStatus: () => ({
          automationRuns: () => [
            ...new Array(faker.datatype.number({ min: 1, max: 5 }))
          ]
        }),
        AutomationRevision: () => ({
          functions: () => [undefined] // array of 1 always,
        }),
        Automation: () => ({
          name: () => faker.company.name(),
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
          repo: {
            url: 'https://github.com/specklesystems/speckle-automate-code-compliance-window-safety',
            owner: 'specklesystems',
            name: 'speckle-automate-code-compliance-window-safety'
          },
          automationCount: () => faker.number.int({ min: 0, max: 99 }),
          description: () => {
            // Example markdown description
            // return [
            //   '# Header',
            //   '## Subheader',
            //   'Some body copy and a [link to somewhere](https://google.com)'
            // ].join('\n')
            return faker.lorem.sentence(20)
          },
          supportedSourceApps: () => {
            const base = SourceAppNames

            // Random assortment from base
            return base.filter(() => faker.datatype.boolean())
          },
          tags: () => {
            // Random string array
            return [...new Array(faker.number.int({ min: 0, max: 5 }))].map(() =>
              faker.lorem.word()
            )
          }
        }),
        AutomateFunctionRelease: () => ({
          versionTag: () => {
            // Fake semantic version
            return `${faker.number.int({
              min: 0,
              max: 9
            })}.${faker.number.int({
              min: 0,
              max: 9
            })}.${faker.number.int({ min: 0, max: 9 })}`
          },
          commitId: () => '0c259d384a4df3cce3f24667560e5124e68f202f',
          inputSchema: () => {
            return {
              $schema: 'https://json-schema.org/draft/2020-12/schema',
              $id: 'https://example.com/product.schema.json',
              title: 'Product',
              description: "A product from Acme's catalog",
              type: 'object',
              properties: {
                Boolean: {
                  description: faker.lorem.sentence(5),
                  type: 'boolean'
                },
                'Required Boolean': {
                  description: faker.lorem.sentence(5),
                  default: true,
                  type: 'boolean'
                },
                Enum: {
                  description: faker.lorem.sentence(5),
                  type: 'string',
                  default: 'bar',
                  oneOf: [
                    {
                      const: 'foo',
                      title: 'FOO'
                    },
                    {
                      const: 'bar',
                      title: 'BAR'
                    }
                  ]
                },
                Integer: {
                  description: faker.lorem.sentence(5),
                  type: 'integer'
                },
                'Required Integer': {
                  description: faker.lorem.sentence(5),
                  default: 2,
                  type: 'integer'
                },
                String: {
                  description: faker.lorem.sentence(5),
                  type: 'string'
                },
                'Required String': {
                  description: faker.lorem.sentence(5),
                  default: 'Foobar',
                  type: 'string'
                }
              },
              required: ['Required Boolean', 'Required Integer', 'Required String']
            }
          }
        }),
        AutomateRun: () => ({
          reason: () => faker.lorem.sentence(),
          id: () => faker.string.alphanumeric(20),
          createdAt: () =>
            faker.date
              .recent(undefined, dayjs().subtract(1, 'day').toDate())
              .toISOString(),
          updatedAt: () => faker.date.recent().toISOString(),
          functionRuns: () => [...new Array(faker.number.int({ min: 1, max: 5 }))],
          statusMessage: () => faker.lorem.sentence()
        }),
        AutomateFunctionRun: () => ({
          contextView: () => `/`,
          elapsed: () => faker.number.int({ min: 0, max: 600 }),
          statusMessage: () => faker.lorem.sentence(),
          results: (): Automate.AutomateTypes.ResultsSchema => {
            return {
              version: Automate.AutomateTypes.RESULTS_SCHEMA_VERSION,
              values: {
                objectResults: [],
                blobIds: [...new Array(faker.number.int({ min: 0, max: 5 }))].map(() =>
                  faker.string.uuid()
                )
              }
            }
          }
        }),
        ServerAutomateInfo: () => ({
          availableFunctionTemplates: () => functionTemplateRepos
        })
      }
    }
  : {}
export default mocks
