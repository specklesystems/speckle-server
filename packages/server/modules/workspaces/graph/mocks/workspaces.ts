/* eslint-disable @typescript-eslint/no-unsafe-return */
import { listMock, SpeckleModuleMocksConfig } from '@/modules/shared/helpers/mocks'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { faker } from '@faker-js/faker'
import { Roles } from '@speckle/shared'
import { omit, times } from 'lodash'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

const workspaceName = () =>
  `${faker.person.firstName()} ${faker.commerce.productName()}`

const config: SpeckleModuleMocksConfig = FF_WORKSPACES_MODULE_ENABLED
  ? {
      resolvers: ({
        helpers: {
          getFieldValue,
          getMockRef,
          resolveFromMockParent,
          addMockRefValues,
          resolveAndCache,
          setMockValues
        }
      }) => {
        return {
          WorkspaceMutations: {
            create: (_parent, args) => {
              if (args.input.name === 'error') {
                throw new Error('Fake workspace create error')
              }

              return getMockRef('Workspace', { values: omit(args.input, ['logoUrl']) })
            },
            delete: () => {
              const val = faker.datatype.boolean()
              if (!val) {
                throw new Error('Fake workspace delete error')
              }

              return val
            },
            update: (_parent, args) => {
              if (args.input.name === 'error') {
                throw new Error('Fake workspace update error')
              }

              setMockValues(
                {
                  type: 'Workspace',
                  id: args.input.id
                },
                omit(args.input, ['logoUrl', 'id'])
              )

              return getMockRef('Workspace', { id: args.input.id })
            },
            updateRole: (_parent, args) => {
              const val = faker.datatype.boolean()

              if (val) {
                throw new Error('Fake update role error')
              }

              return getMockRef('Workspace', {
                id: args.input.workspaceId
              })
            },
            deleteRole: (_parent, args) => {
              const val = faker.datatype.boolean()

              if (val) {
                throw new Error('Fake delete role error')
              }

              return getMockRef('Workspace', {
                id: args.input.workspaceId
              })
            }
          },
          WorkspaceInviteMutations: {
            create: (_parent, args) => {
              const val = faker.datatype.boolean()

              if (val) {
                throw new Error('Fake invite create error')
              }

              return getMockRef('Workspace', {
                id: args.workspaceId
              })
            },
            batchCreate: (_parent, args) => {
              const val = faker.datatype.boolean()

              if (val) {
                throw new Error('Fake batch create invite error')
              }

              return getMockRef('Workspace', {
                id: args.workspaceId
              })
            },
            use: () => {
              const val = faker.datatype.boolean()
              if (!val) {
                throw new Error('Fake use invite error')
              }

              return val
            },
            cancel: (_parent, args) => {
              const val = faker.datatype.boolean()

              if (val) {
                throw new Error('Fake cancel invite error')
              }

              return getMockRef('Workspace', {
                id: args.workspaceId
              })
            }
          },
          Query: {
            workspace: (_parent, args) => {
              if (args.id === '404') {
                throw new WorkspaceNotFoundError('Workspace not found')
              }

              return getMockRef('Workspace', {
                id: args.id
              })
            },
            workspaceInvite: (_parent, args) => {
              const getResult = () => getMockRef('PendingWorkspaceCollaborator')
              if (args.token) {
                return getResult()
              }

              return faker.datatype.boolean() ? getResult() : null
            }
          },
          User: {
            workspaces: resolveAndCache((_parent, args) =>
              getMockRef('WorkspaceCollection', {
                values: {
                  cursor: args.cursor ? null : undefined
                }
              })
            ),
            workspaceInvites: resolveAndCache(() =>
              times(faker.number.int({ min: 0, max: 2 }), () =>
                getMockRef('PendingWorkspaceCollaborator')
              )
            )
          },
          Workspace: {
            role: resolveFromMockParent(),
            team: resolveFromMockParent(),
            invitedTeam: resolveFromMockParent({
              mapRefs: (mock, { parent }) =>
                addMockRefValues(mock, {
                  workspaceId: getFieldValue(parent, 'id'),
                  workspaceName: getFieldValue(parent, 'name')
                })
            }),
            projects: resolveAndCache((_parent, args) =>
              getMockRef('ProjectCollection', {
                values: {
                  cursor: args.cursor ? null : undefined
                }
              })
            )
          },
          WorkspaceCollaborator: {
            role: resolveFromMockParent(),
            user: resolveFromMockParent()
          },
          PendingWorkspaceCollaborator: {
            user: resolveAndCache((parent) => {
              const title = getFieldValue<string>(parent, 'title')
              const isEmail = title.includes('@')
              if (isEmail) return null

              return getMockRef('LimitedUser', { values: { name: title } })
            }),
            invitedBy: resolveAndCache(() => getMockRef('LimitedUser')),
            workspaceName: resolveFromMockParent(),
            token: resolveFromMockParent()
          },
          Project: {
            workspace: resolveAndCache(() => {
              return faker.datatype.boolean() ? getMockRef('Workspace') : null
            })
          },
          AdminQueries: {
            workspaceList: resolveAndCache((_parent, args) =>
              getMockRef('WorkspaceCollection', {
                values: {
                  cursor: args.cursor ? null : undefined
                }
              })
            )
          },
          WorkspaceCollection: {
            items: resolveAndCache((parent) => {
              const count = getFieldValue(parent, 'totalCount')

              return times(count, () => getMockRef('Workspace'))
            })
          }
        }
      },
      mocks: {
        Workspace: () => ({
          name: workspaceName(),
          description: faker.lorem.sentence(),
          role: faker.helpers.arrayElement(Object.values(Roles.Workspace)),
          team: listMock(1, 5),
          invitedTeam: listMock(1, 5)
        }),
        WorkspaceCollaborator: () => ({
          role: () => faker.helpers.arrayElement(Object.values(Roles.Server))
        }),
        PendingWorkspaceCollaborator: () => ({
          inviteId: faker.string.uuid(),
          workspaceId: faker.string.uuid(),
          workspaceName: workspaceName(),
          title: faker.datatype.boolean()
            ? faker.internet.email()
            : faker.person.fullName(),
          role: faker.helpers.arrayElement(Object.values(Roles.Workspace)),
          token: faker.string.alphanumeric(32)
        }),
        WorkspaceCollection: () => ({
          totalCount: faker.number.int({ min: 0, max: 10 })
        })
      }
    }
  : {}
export default config
