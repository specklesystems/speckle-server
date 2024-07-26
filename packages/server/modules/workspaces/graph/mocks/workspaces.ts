/* eslint-disable @typescript-eslint/no-unsafe-return */
import { SpeckleModuleMocksConfig } from '@/modules/shared/helpers/mocks'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { faker } from '@faker-js/faker'
import { Roles } from '@speckle/shared'
import { times } from 'lodash'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

const workspaceName = () =>
  `${faker.person.firstName()} ${faker.commerce.productName()}`

const config: SpeckleModuleMocksConfig = FF_WORKSPACES_MODULE_ENABLED
  ? {
      resolvers: ({
        helpers: { getObject, getObjectField, getObjectWithValues, getParentField }
      }) => {
        return {
          Query: {
            workspace: (_parent, args) => {
              if (args.id === '404') {
                throw new WorkspaceNotFoundError('Workspace not found')
              }

              return getObject('Workspace', args.id)
            },
            workspaceInvite: (_parent, args) => {
              const getResult = () => getObject('PendingWorkspaceCollaborator')
              if (args.token) {
                return getResult()
              }

              return faker.datatype.boolean() ? getResult() : null
            }
          },
          User: {
            workspaces: (_parent, args) =>
              getObjectWithValues('WorkspaceCollection', {
                cursor: args.cursor ? null : undefined
              }),
            workspaceInvites: () =>
              times(faker.number.int({ min: 0, max: 2 }), () =>
                getObject('PendingWorkspaceCollaborator')
              )
          },
          Workspace: {
            role: (parent) => getObjectField('Workspace', parent.id, 'role'),
            team: () =>
              times(faker.number.int({ min: 1, max: 5 }), () =>
                getObject('WorkspaceCollaborator')
              ),
            invitedTeam: (parent) =>
              times(faker.number.int({ min: 1, max: 5 }), () =>
                getObjectWithValues('PendingWorkspaceCollaborator', {
                  workspaceId: getParentField(parent, 'id'),
                  workspaceName: getParentField(parent, 'name')
                })
              ),
            projects: (_parent, args) =>
              getObjectWithValues('ProjectCollection', {
                cursor: args.cursor ? null : undefined
              })
          },
          PendingWorkspaceCollaborator: {
            user: (parent) => {
              const title = getParentField<string>(parent, 'title')
              const isEmail = title.includes('@')
              if (isEmail) return null

              return getObjectWithValues('LimitedUser', { name: title })
            },
            invitedBy: () => getObject('LimitedUser')
          },
          Project: {
            workspace: () => {
              return faker.datatype.boolean() ? getObject('Workspace') : null
            }
          },
          AdminQueries: {
            workspaceList: (_parent, args) =>
              getObjectWithValues('WorkspaceCollection', {
                cursor: args.cursor ? null : undefined
              })
          },
          WorkspaceCollection: {
            items: (parent) => {
              const count = getParentField(parent, 'totalCount')

              return times(count, () => getObject('Workspace'))
            }
          }
        }
      },
      mocks: {
        Workspace: () => ({
          name: workspaceName(),
          description: faker.lorem.sentence(),
          role: faker.helpers.arrayElement(Object.values(Roles.Workspace))
        }),
        WorkspaceCollaborator: () => ({
          role: faker.helpers.arrayElement(Object.values(Roles.Server))
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
