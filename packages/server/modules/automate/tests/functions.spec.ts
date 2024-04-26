/* eslint-disable camelcase */
import {
  InvalidFunctionTemplateError,
  MisconfiguredTemplateOrgError,
  MissingAutomateGithubAuthError
} from '@/modules/automate/errors/github'
import {
  generateFunctionId,
  upsertFunction,
  updateFunction as updateDbFunction,
  getFunction,
  upsertFunctionToken,
  getFunctionByExecEngineId,
  getFunctionToken,
  insertFunctionRelease
} from '@/modules/automate/repositories/functions'
import {
  CreateFunctionReleaseDeps,
  FunctionReleaseCreateBody,
  createFunctionFromTemplate,
  createFunctionRelease,
  updateFunction
} from '@/modules/automate/services/functionManagement'
import { createAutomateRepoFromTemplate } from '@/modules/automate/services/github'
import {
  GithubCreateRepoFromTemplateData,
  OAuthAppAuthentication,
  createRepoFromTemplate,
  encryptSecret
} from '@/modules/core/clients/github'
import {
  AutomateFunctionTemplateLanguage,
  CreateAutomateFunctionInput,
  UpdateAutomateFunctionInput
} from '@/modules/core/graph/generated/graphql'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { beforeEachContext } from '@/test/hooks'
import { Environment, Roles, SourceAppNames } from '@speckle/shared'
import { expect } from 'chai'
import { getValidatedUserAuthMetadata } from '@/modules/core/services/githubApp'
import { OrgAuthAccessRestrictionsError } from '@/modules/core/errors/github'
import { createFunction } from '@/modules/automate/clients/executionEngine'
import { getUser } from '@/modules/core/repositories/users'
import {
  AutomateFunctionCreationError,
  AutomateFunctionReleaseCreateError,
  AutomateFunctionUpdateError
} from '@/modules/automate/errors/management'
import { isString, omit } from 'lodash'
import { Request } from 'express'
import { ForbiddenError, UnauthorizedError } from '@/modules/shared/errors'
import { AutomateFunctionReleases } from '@/modules/core/dbSchema'

const { FF_AUTOMATE_MODULE_ENABLED } = Environment.getFeatureFlags()

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
    getValidatedGithubAuthMetadata: ReturnType<typeof getValidatedUserAuthMetadata>
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
        functionId: generateFunctionId(),
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
    getUser,
    generateFunctionId,
    upsertFunctionToken
  })

  return create
}

const buildUpdateFn = () => {
  const update = updateFunction({
    updateFunction: updateDbFunction,
    getFunction
  })

  return update
}

const buildCreateFunctionReleaseFn = (
  resolveFunctionParams: CreateFunctionReleaseDeps['resolveFunctionParams']
) => {
  const create = createFunctionRelease({
    resolveFunctionParams,
    getFunctionByExecEngineId,
    getFunctionToken,
    insertFunctionRelease
  })

  return create
}

const buildFakeReq = (): Request =>
  ({
    params: {},
    body: {},
    headers: {},
    cookies: {}
  } as Request)

;(FF_AUTOMATE_MODULE_ENABLED ? describe : describe.skip)(
  'Automate Functions @automate',
  () => {
    const me: BasicTestUser = {
      id: '',
      name: 'Itsa Me!',
      email: 'me@automate.com',
      role: Roles.Server.User
    }

    const otherGuy: BasicTestUser = {
      id: '',
      name: 'Other dude',
      email: 'otherguy@automate.com',
      role: Roles.Server.User
    }

    before(async () => {
      await beforeEachContext()
      await createTestUsers([me, otherGuy])
    })

    describe('creation', () => {
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
        const execEngineFn = {
          functionId: '456',
          token: 'some-token'
        }
        const createFn = buildCreateFn({
          createExecutionEngineFn: async () => execEngineFn
        })
        const fn = await createFn({
          input: exampleCreationInput(),
          userId: me.id
        })

        expect(fn).to.be.ok
        expect(fn.fn).to.be.ok
        expect(fn.fn.functionId).to.be.ok
        expect(fn.fn.executionEngineFunctionId).to.eq(execEngineFn.functionId)
        expect(fn.repo).to.be.ok
        expect(fn.repo.id).to.be.ok
        expect(fn.token.token).to.eq(execEngineFn.token)
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

    describe('updating', () => {
      let updatableFn: Awaited<
        ReturnType<ReturnType<typeof createFunctionFromTemplate>>
      >

      before(async () => {
        const createFn = buildCreateFn()
        updatableFn = await createFn({
          input: exampleCreationInput(),
          userId: me.id
        })
      })

      it('fails when trying to update non-existent function', async () => {
        const updateFn = buildUpdateFn()
        try {
          await updateFn({
            userId: me.id,
            input: {
              name: 'new-name',
              id: 'babababa'
            }
          })
        } catch (e) {
          expect(e).to.have.property('name', AutomateFunctionUpdateError.name)
          expect(e).to.have.property('message', 'Function not found')
        }
      })

      it('fails when trying to update function of another user', async () => {
        const updateFn = buildUpdateFn()
        try {
          await updateFn({
            userId: otherGuy.id,
            input: {
              name: 'new-name',
              id: updatableFn.fn.functionId
            }
          })
        } catch (e) {
          expect(e).to.have.property('name', AutomateFunctionUpdateError.name)
          expect(e).to.have.property(
            'message',
            'User does not have the rights to update this function'
          )
        }
      })

      it('only updates set & non-null values', async () => {
        const newName = 'new-name'

        const updateFn = buildUpdateFn()
        const updatedFn = await updateFn({
          userId: me.id,
          input: {
            name: newName,
            id: updatableFn.fn.functionId,
            description: null,
            logo: null,
            supportedSourceApps: null,
            tags: null
          }
        })

        expect(updatedFn).to.be.ok
        expect(updatedFn.name).to.equal(newName)
        expect(updatedFn.description).to.equal(updatableFn.fn.description)
        expect(updatedFn.logo).to.equal(updatableFn.fn.logo)
        expect(updatedFn.supportedSourceApps).to.deep.equal(
          updatableFn.fn.supportedSourceApps
        )
        expect(updatedFn.tags).to.deep.equal(updatableFn.fn.tags)
      })

      it('filters out invalid logo', async () => {
        const updateFn = buildUpdateFn()
        const updatedFn = await updateFn({
          userId: me.id,
          input: {
            name: 'new-name',
            id: updatableFn.fn.functionId,
            logo: 'invalid-url'
          }
        })

        expect(updatedFn.logo).to.eq(updatableFn.fn.logo)
      })

      it('updates all available properties', async () => {
        const input: UpdateAutomateFunctionInput = {
          name: 'new-name',
          id: updatableFn.fn.functionId,
          description: 'new-desc',
          logo: 'https://example.com/new-logo.png',
          supportedSourceApps: [SourceAppNames[1]],
          tags: ['new-tag1', 'new-tag2']
        }
        const updateFn = buildUpdateFn()
        const updatedFn = await updateFn({
          userId: me.id,
          input
        })

        expect(updatedFn).to.deep.include(omit(input, 'id'))
      })

      describe('with new function release', () => {
        const validResolveFunctionParams: CreateFunctionReleaseDeps['resolveFunctionParams'] =
          () => ({
            functionId: updatableFn.fn.executionEngineFunctionId,
            token: updatableFn.token.token
          })

        const validBody = (): FunctionReleaseCreateBody => ({
          commitId: '62f55086bd',
          versionTag: '123.45.67',
          inputSchema: {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            $id: 'https://example.com/product.schema.json',
            title: 'Product',
            description: "A product from Acme's catalog",
            type: 'object',
            properties: {
              productId: {
                description: 'The unique identifier for a product',
                type: 'integer'
              }
            },
            required: ['productId']
          },
          command: ['python', 'main.py'],
          recommendedCPUm: 1000,
          recommendedMemoryMi: 1000
        })

        const releaseKeys = AutomateFunctionReleases.withoutTablePrefix.col

        it('fails if unable to resolve function ID from req', async () => {
          const createFnRelease = buildCreateFunctionReleaseFn(() => ({}))
          const req = buildFakeReq()

          try {
            await createFnRelease({ req })
          } catch (e) {
            expect(e).to.have.property('name', AutomateFunctionReleaseCreateError.name)
            expect(e).to.have.property(
              'message',
              'Could not resolve function ID from request'
            )
          }
        })

        it('throws 401 if missing token', async () => {
          const createFnRelease = buildCreateFunctionReleaseFn(() => ({
            functionId: updatableFn.fn.executionEngineFunctionId
          }))
          const req = buildFakeReq()

          try {
            await createFnRelease({ req })
          } catch (e) {
            expect(e).to.have.property('name', UnauthorizedError.name)
          }
        })

        it('fails if invalid function id', async () => {
          const createFnRelease = buildCreateFunctionReleaseFn(() => ({
            functionId: 'invalid-id',
            token: 'valid-token'
          }))
          const req = buildFakeReq()

          try {
            await createFnRelease({ req })
          } catch (e) {
            expect(e).to.have.property('name', AutomateFunctionReleaseCreateError.name)
            expect(e).to.have.property('message', 'Function not found')
          }
        })

        it('throws 403 if invalid token', async () => {
          const createFnRelease = buildCreateFunctionReleaseFn(() => ({
            functionId: updatableFn.fn.executionEngineFunctionId,
            token: 'invalid-token'
          }))
          const req = buildFakeReq()

          try {
            await createFnRelease({ req })
          } catch (e) {
            expect(e).to.have.property('name', ForbiddenError.name)
          }
        })

        describe('and invalid body', () => {
          it('fails if body is not a JSON object', async () => {
            const createFnRelease = buildCreateFunctionReleaseFn(
              validResolveFunctionParams
            )
            const req = buildFakeReq()
            req.body = 'invalid-body'

            try {
              await createFnRelease({ req })
            } catch (e) {
              expect(e).to.have.property(
                'name',
                AutomateFunctionReleaseCreateError.name
              )
              expect(e).to.have.property('message', 'Request body is not a JSON object')
            }
          })

          type InvalidBodyPropTestRun = {
            value: unknown
            description: string
            errorMsg?: string
          }

          type InvalidBodyPropTestRunGroup = {
            key: keyof FunctionReleaseCreateBody
            errorMsg: string | RegExp
            runs: InvalidBodyPropTestRun[]
          }

          const invalidBodyPropTestGroups: InvalidBodyPropTestRunGroup[] = [
            {
              key: 'commitId',
              errorMsg: 'commitId must be a string of at least 6 characters',
              runs: [
                {
                  value: undefined,
                  description: 'missing commitId'
                },
                {
                  value: 123,
                  description: 'invalid commitId type'
                },
                {
                  value: '123',
                  description: 'commitId too short'
                }
              ]
            },
            {
              key: 'versionTag',
              errorMsg:
                'versionTag must be a string with a max length of 128 characters. The first character must be alphanumeric (of lower or upper case) or an underscore, the subsequent characters may be alphanumeric (or lower or upper case), underscore, hyphen, or period.',
              runs: [
                {
                  value: undefined,
                  description: 'missing versionTag'
                },
                {
                  value: 123,
                  description: 'invalid versionTag type'
                },
                {
                  value: '1'.repeat(129),
                  description: 'versionTag too long'
                },
                {
                  value: '$invalid',
                  description: 'versionTag starts with invalid character'
                }
              ]
            },
            {
              key: 'inputSchema',
              errorMsg: /^inputSchema must be a valid JSON schema/,
              runs: [
                {
                  value: 123,
                  description: 'invalid inputSchema type',
                  errorMsg: 'inputSchema must be an object'
                },
                {
                  value: { $schema: 'invalid' },
                  description: 'invalid $schema'
                },
                {
                  value: { $id: 444 },
                  description: 'invalid $id'
                },
                {
                  value: { type: 'invalid' },
                  description: 'invalid type'
                },
                {
                  value: { properties: { productId: { type: 'invalid' } } },
                  description: 'invalid property type'
                }
              ]
            },
            {
              key: 'command',
              errorMsg: 'command must be a non-empty array of strings',
              runs: [
                {
                  value: undefined,
                  description: 'missing command'
                },
                {
                  value: 123,
                  description: 'invalid command type'
                },
                {
                  value: [],
                  description: 'empty command'
                },
                {
                  value: ['python', 123],
                  description: 'invalid command element'
                }
              ]
            },
            {
              key: 'recommendedCPUm',
              errorMsg: 'recommendedCPUm must be an integer between 100 and 16000',
              runs: [
                {
                  value: 3.14,
                  description: 'recommendedCPUm not an integer'
                },
                {
                  value: 99,
                  description: 'recommendedCPUm too low'
                },
                {
                  value: 16001,
                  description: 'recommendedCPUm too high'
                }
              ]
            },
            {
              key: 'recommendedMemoryMi',
              errorMsg: 'recommendedMemoryMi must be an integer between 1 and 8000',
              runs: [
                {
                  value: 3.14,
                  description: 'recommendedMemoryMi not an integer'
                },
                {
                  value: 0,
                  description: 'recommendedMemoryMi too low'
                },
                {
                  value: 8001,
                  description: 'recommendedMemoryMi too high'
                }
              ]
            }
          ]

          invalidBodyPropTestGroups.forEach(({ key, errorMsg, runs }) => {
            runs.forEach(({ value, description, errorMsg: errorMsgOverride }) => {
              it(`fails if ${description}`, async () => {
                let didThrow = false
                const createFnRelease = buildCreateFunctionReleaseFn(
                  validResolveFunctionParams
                )
                const req = buildFakeReq()
                req.body = { ...validBody(), [key]: value }

                try {
                  await createFnRelease({ req })
                } catch (e) {
                  didThrow = true
                  expect(e).to.have.property(
                    'name',
                    AutomateFunctionReleaseCreateError.name
                  )

                  const msgTest = errorMsgOverride || errorMsg
                  if (isString(msgTest)) {
                    expect(e).to.have.property('message', msgTest)
                  } else {
                    expect(e).to.have.property('message').match(msgTest)
                  }
                }

                expect(didThrow).to.be.true
              })
            })
          })
        })

        it('successfully creates valid function release', async () => {
          const createFnRelease = buildCreateFunctionReleaseFn(
            validResolveFunctionParams
          )
          const req = buildFakeReq()
          const body = validBody()
          req.body = body

          const fnRelease = await createFnRelease({ req })

          expect(fnRelease).to.be.ok
          expect(fnRelease).to.have.property(
            releaseKeys.functionId,
            updatableFn.fn.functionId
          )
          expect(fnRelease).to.have.property(releaseKeys.gitCommitId, body.commitId)
          expect(fnRelease).to.have.property(releaseKeys.versionTag, body.versionTag)
          expect(fnRelease).to.have.property(
            releaseKeys.recommendedCPUm,
            body.recommendedCPUm
          )
          expect(fnRelease).to.have.property(
            releaseKeys.recommendedMemoryMi,
            body.recommendedMemoryMi
          )
          expect(fnRelease.inputSchema).to.deep.equalInAnyOrder(body.inputSchema)
          expect(fnRelease.command).to.deep.equal(body.command)
        })
      })
    })
  }
)
