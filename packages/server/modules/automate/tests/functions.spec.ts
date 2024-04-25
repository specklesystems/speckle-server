/* eslint-disable camelcase */
import {
  InvalidFunctionTemplateError,
  MisconfiguredTemplateOrgError,
  MissingAutomateGithubAuthError
} from '@/modules/automate/errors/github'
import { upsertFunction } from '@/modules/automate/repositories/functions'
import { createFunctionFromTemplate } from '@/modules/automate/services/functionManagement'
import { createAutomateRepoFromTemplate } from '@/modules/automate/services/github'
import {
  GithubCreateRepoFromTemplateData,
  OAuthAppAuthentication,
  createRepoFromTemplate,
  encryptSecret
} from '@/modules/core/clients/github'
import {
  AutomateFunctionTemplateLanguage,
  CreateAutomateFunctionInput
} from '@/modules/core/graph/generated/graphql'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import { beforeEachContext } from '@/test/hooks'
import { Environment, Roles, SourceAppNames } from '@speckle/shared'
import { expect } from 'chai'
import { getValidatedUserAuthMetadata } from '@/modules/core/services/githubApp'
import { OrgAuthAccessRestrictionsError } from '@/modules/core/errors/github'
import { createFunction } from '@/modules/automate/clients/executionEngine'
import { getUser } from '@/modules/core/repositories/users'
import { AutomateFunctionCreationError } from '@/modules/automate/errors/management'

const { FF_AUTOMATE_MODULE_ENABLED } = Environment.getFeatureFlags()

;(FF_AUTOMATE_MODULE_ENABLED ? describe : describe.skip)(
  'Automate Functions @automate',
  () => {
    const me: BasicTestUser = {
      id: '',
      name: 'Itsa Me!',
      email: 'me@automate.com',
      role: Roles.Server.User
    }

    before(async () => {
      await beforeEachContext()
      await createTestUser(me)
    })

    describe('creation', () => {
      const exampleCreationInput = (): CreateAutomateFunctionInput => ({
        template: AutomateFunctionTemplateLanguage.Python,
        name: 'test-fn',
        description: 'test description',
        logo: 'https://example.com/logo.png',
        supportedSourceApps: [SourceAppNames[0]],
        tags: ['tag1', 'tag2']
      })

      /**
       * Everything's the real implementation except the GH & Execution Engine API calls
       */
      const buildCreateFn = (
        overrides?: Partial<{
          getValidatedGithubAuthMetadata: ReturnType<
            typeof getValidatedUserAuthMetadata
          >
          createRepoFromTemplate: typeof createRepoFromTemplate
          createExecutionEngineFn: typeof createFunction
        }>
      ) => {
        const getValidatedGithubAuthMetadata =
          overrides?.getValidatedGithubAuthMetadata ||
          (async (): Promise<OAuthAppAuthentication> => ({
            token: 'a',
            scopes: ['b', 'c'],
            clientType: 'oauth-app',
            clientId: 'd',
            clientSecret: 'e',
            tokenType: 'oauth',
            type: 'token'
          }))

        const create = createFunctionFromTemplate({
          createGithubRepo: createAutomateRepoFromTemplate({
            getValidatedGithubAuthMetadata,
            createRepoFromTemplate:
              overrides?.createRepoFromTemplate ||
              (async () =>
                ({
                  id: '123',
                  name: 'speckle-server',
                  full_name: 'specklesystems/speckle-server',
                  html_url: 'https://github.com/specklesystems/speckle-server',
                  ssh_url: 'git@github.com:specklesystems/speckle-server.git'
                } as unknown as GithubCreateRepoFromTemplateData))
          }),
          upsertFn: upsertFunction,
          createExecutionEngineFn:
            overrides?.createExecutionEngineFn ||
            (async () => ({
              functionId: '456',
              token: 'aaaaa'
            })),
          generateAuthCode: async () => 'test-auth-code',
          getValidatedGithubAuthMetadata,
          getGithubRepoPublicKey: async () => ({
            key_id: '3380204578043523366',
            key: 'enDLkz8Llm+QHwTL3CwMdzhxoUpAZj3S5mJKWmyBi1A='
          }),
          encryptGithubSecret: encryptSecret,
          upsertGithubSecret: async () => true,
          insertGithubEnvVar: async () => true,
          getUser
        })

        return create
      }

      it('fails with invalid template id', async () => {
        const createFn = buildCreateFn()
        try {
          await createFn({
            input: {
              ...exampleCreationInput(),
              template: 'invalid-template-id' as AutomateFunctionTemplateLanguage
            },
            userId: me.id
          })
        } catch (e) {
          expect(e).to.have.property('name', InvalidFunctionTemplateError.name)
        }
      })

      it('fails without valid github auth', async () => {
        const createFn = buildCreateFn({
          getValidatedGithubAuthMetadata: async () => null
        })
        try {
          await createFn({
            input: exampleCreationInput(),
            userId: me.id
          })
        } catch (e) {
          expect(e).to.have.property('name', MissingAutomateGithubAuthError.name)
        }
      })

      it('fails if GH app is not configured w/ specklesystems templates properly', async () => {
        const createFn = buildCreateFn({
          createRepoFromTemplate: async () => {
            throw new OrgAuthAccessRestrictionsError()
          }
        })
        try {
          await createFn({
            input: exampleCreationInput(),
            userId: me.id
          })
        } catch (e) {
          expect(e).to.have.property('name', MisconfiguredTemplateOrgError.name)
        }
      })

      it('fails with invalid user', async () => {
        const createFn = buildCreateFn()
        try {
          await createFn({
            input: exampleCreationInput(),
            userId: 'invalid-user-id'
          })
        } catch (e) {
          expect(e).to.have.property('name', AutomateFunctionCreationError.name)
          expect(e).to.have.property('message', 'Speckle user not found')
        }
      })

      it('works with valid metadata', async () => {
        const createFn = buildCreateFn()
        const fn = await createFn({
          input: exampleCreationInput(),
          userId: me.id
        })

        expect(fn).to.be.ok
        expect(fn.fn).to.be.ok
        expect(fn.fn.functionId).to.be.ok
        expect(fn.fn.executionEngineFunctionId).to.be.ok
        expect(fn.repo).to.be.ok
        expect(fn.repo.id).to.be.ok
      })

      it('removes invalid logo', async () => {
        const createFn = buildCreateFn()
        const fn = await createFn({
          input: {
            ...exampleCreationInput(),
            logo: 'invalid-url'
          },
          userId: me.id
        })

        expect(fn.fn.logo).to.be.null
      })
    })
  }
)
