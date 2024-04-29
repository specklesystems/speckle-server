/* eslint-disable camelcase */
import {
  InvalidFunctionTemplateError,
  MisconfiguredTemplateOrgError,
  MissingAutomateGithubAuthError
} from '@/modules/automate/errors/github'
import {
  CreateFunctionReleaseDeps,
  FunctionReleaseCreateBody,
  createFunctionFromTemplate
} from '@/modules/automate/services/functionManagement'
import {
  AutomateFunctionTemplateLanguage,
  UpdateAutomateFunctionInput
} from '@/modules/core/graph/generated/graphql'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { beforeEachContext } from '@/test/hooks'
import { Environment, Roles, SourceAppNames } from '@speckle/shared'
import { expect } from 'chai'
import { OrgAuthAccessRestrictionsError } from '@/modules/core/errors/github'
import {
  AutomateFunctionCreationError,
  AutomateFunctionReleaseCreateError,
  AutomateFunctionUpdateError
} from '@/modules/automate/errors/management'
import { isString, omit } from 'lodash'
import { ForbiddenError, UnauthorizedError } from '@/modules/shared/errors'
import { AutomateFunctionReleases } from '@/modules/core/dbSchema'
import {
  buildCreateFn,
  buildCreateFunctionReleaseFn,
  buildUpdateFn,
  exampleCreationInput,
  exampleFunctionReleaseCreateBody
} from '@/test/speckle-helpers/automationHelper'
import { expectToThrow } from '@/test/assertionHelper'

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

        const e = await expectToThrow(
          async () =>
            await createFn({
              input: {
                ...exampleCreationInput(),
                template: 'invalid-template-id' as AutomateFunctionTemplateLanguage
              },
              userId: me.id
            })
        )
        expect(e).to.have.property('name', InvalidFunctionTemplateError.name)
      })

      it('fails without valid github auth', async () => {
        const createFn = buildCreateFn({
          getValidatedGithubAuthMetadata: async () => null
        })

        const e = await expectToThrow(
          async () =>
            await createFn({
              input: exampleCreationInput(),
              userId: me.id
            })
        )
        expect(e).to.have.property('name', MissingAutomateGithubAuthError.name)
      })

      it('fails if GH app is not configured w/ specklesystems templates properly', async () => {
        const createFn = buildCreateFn({
          createRepoFromTemplate: async () => {
            throw new OrgAuthAccessRestrictionsError()
          }
        })

        const e = await expectToThrow(
          async () =>
            await createFn({
              input: exampleCreationInput(),
              userId: me.id
            })
        )
        expect(e).to.have.property('name', MisconfiguredTemplateOrgError.name)
      })

      it('fails with invalid user', async () => {
        const createFn = buildCreateFn()

        const e = await expectToThrow(
          async () =>
            await createFn({
              input: exampleCreationInput(),
              userId: 'invalid-user-id'
            })
        )
        expect(e).to.have.property('name', AutomateFunctionCreationError.name)
        expect(e).to.have.property('message', 'Speckle user not found')
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

        const e = await expectToThrow(
          async () =>
            await updateFn({
              userId: me.id,
              input: {
                name: 'new-name',
                id: 'babababa'
              }
            })
        )
        expect(e).to.have.property('name', AutomateFunctionUpdateError.name)
        expect(e).to.have.property('message', 'Function not found')
      })

      it('fails when trying to update function of another user', async () => {
        const updateFn = buildUpdateFn()

        const e = await expectToThrow(
          async () =>
            await updateFn({
              userId: otherGuy.id,
              input: {
                name: 'new-name',
                id: updatableFn.fn.functionId
              }
            })
        )
        expect(e).to.have.property('name', AutomateFunctionUpdateError.name)
        expect(e).to.have.property(
          'message',
          'User does not have the rights to update this function'
        )
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

        const validBody = exampleFunctionReleaseCreateBody

        const releaseKeys = AutomateFunctionReleases.withoutTablePrefix.col

        it('fails if unable to resolve function ID from req', async () => {
          const createFnRelease = buildCreateFunctionReleaseFn(() => ({}))

          const e = await expectToThrow(async () => await createFnRelease())
          expect(e).to.have.property('name', AutomateFunctionReleaseCreateError.name)
          expect(e).to.have.property(
            'message',
            'Could not resolve function ID from request'
          )
        })

        it('throws 401 if missing token', async () => {
          const createFnRelease = buildCreateFunctionReleaseFn(() => ({
            functionId: updatableFn.fn.executionEngineFunctionId
          }))

          const e = await expectToThrow(async () => await createFnRelease())
          expect(e).to.have.property('name', UnauthorizedError.name)
        })

        it('fails if invalid function id', async () => {
          const createFnRelease = buildCreateFunctionReleaseFn(() => ({
            functionId: 'invalid-id',
            token: 'valid-token'
          }))

          const e = await expectToThrow(async () => await createFnRelease())
          expect(e).to.have.property('name', AutomateFunctionReleaseCreateError.name)
          expect(e).to.have.property('message', 'Function not found')
        })

        it('throws 403 if invalid token', async () => {
          const createFnRelease = buildCreateFunctionReleaseFn(() => ({
            functionId: updatableFn.fn.executionEngineFunctionId,
            token: 'invalid-token'
          }))

          const e = await expectToThrow(async () => await createFnRelease())
          expect(e).to.have.property('name', ForbiddenError.name)
        })

        describe('and invalid body', () => {
          it('fails if body is not a JSON object', async () => {
            const createFnRelease = buildCreateFunctionReleaseFn(
              validResolveFunctionParams
            )

            const e = await expectToThrow(
              async () =>
                await createFnRelease({
                  req: (req) => {
                    req.body = 'invalid-body'
                    return req
                  }
                })
            )
            expect(e).to.have.property('name', AutomateFunctionReleaseCreateError.name)
            expect(e).to.have.property('message', 'Request body is not a JSON object')
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
                const createFnRelease = buildCreateFunctionReleaseFn(
                  validResolveFunctionParams
                )

                const e = await expectToThrow(
                  async () =>
                    await createFnRelease({
                      req: (req) => {
                        req.body = { ...validBody(), [key]: value }
                        return req
                      }
                    })
                )
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
              })
            })
          })
        })

        it('successfully creates valid function release', async () => {
          const createFnRelease = buildCreateFunctionReleaseFn(
            validResolveFunctionParams
          )
          const body = validBody()

          const fnRelease = await createFnRelease({
            req: (req) => {
              req.body = body
              return req
            }
          })

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
