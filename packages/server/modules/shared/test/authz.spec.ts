import { expect } from 'chai'
import type { AuthContext, AuthFailedResult } from '@/modules/shared/authz'
import {
  authPipelineCreator,
  authFailed,
  authSuccess,
  validateRole,
  validateScope,
  allowForAllRegisteredUsersOnPublicStreamsWithPublicComments,
  allowForRegisteredUsersOnPublicStreamsEvenWithoutRole,
  allowForServerAdmins,
  validateResourceAccess,
  validateRequiredStreamFactory,
  isAuthFailedResult
} from '@/modules/shared/authz'
import {
  ForbiddenError as SFE,
  UnauthorizedError as SUE,
  UnauthorizedError,
  ContextError,
  NotFoundError,
  BaseError
} from '@/modules/shared/errors'
import type { AvailableRoles } from '@speckle/shared'
import { ensureError, Roles } from '@speckle/shared'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'
import type { StreamRecord } from '@/modules/core/helpers/types'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import type {
  AuthData,
  AuthPipelineFunction,
  AuthResult
} from '@/modules/shared/domain/authz/types'
import type { UserRoleData } from '@/modules/shared/domain/rolesAndScopes/types'

describe('AuthZ @shared', () => {
  const buildFooAuthData = (): AuthData =>
    ({
      context: { foo: 'bar' } as unknown as AuthContext
    } as AuthData)
  const buildEmptyContext = (): AuthContext => ({} as unknown as AuthContext)
  const buildEmptySuccess = () => authSuccess(buildEmptyContext())

  describe('Auth pipeline', () => {
    it('Empty pipeline returns no authorization', async () => {
      const pipeline = authPipelineCreator([])
      const { authResult } = await pipeline(buildFooAuthData())
      expect(authResult.authorized).to.equal(false)
    })
    it('Pipeline breaks on fatal error', async () => {
      const errorMessage = 'dummy'
      const fatalFail = async () =>
        authFailed(buildEmptyContext(), new BaseError(errorMessage), true)
      const shouldRescue = async () => buildEmptySuccess()
      const pipeline = authPipelineCreator([shouldRescue, fatalFail, shouldRescue])
      const { authResult } = await pipeline(buildFooAuthData())

      if (!isAuthFailedResult(authResult)) {
        throw new Error('AuthResult should be an auth failed result')
      }

      expect(authResult.authorized).to.equal(false)
      expect(authResult.fatal).to.equal(true)
      expect(authResult.error?.message).to.equal(errorMessage)
    })
    it('Pipeline continues for non fatal errors', async () => {
      const nonFatalFail = async () =>
        authFailed(buildEmptyContext(), new BaseError('errorMessage'), false)
      const shouldRescue = async () => buildEmptySuccess()
      const pipeline = authPipelineCreator([shouldRescue, nonFatalFail, shouldRescue])
      const { authResult } = await pipeline(buildFooAuthData())

      if (isAuthFailedResult(authResult)) {
        throw new Error('AuthResult should not be an auth failed result')
      }

      expect(authResult.authorized).to.equal(true)
    })
    it('Pipeline throws Error if authorized but has error', async () => {
      const borkedStep: AuthPipelineFunction = async () => ({
        authResult: {
          authorized: true,
          error: new UnauthorizedError('Weird stuff'),
          fatal: false
        },
        context: undefined as unknown as AuthContext
      })
      const pipeline = authPipelineCreator([borkedStep])
      try {
        await pipeline(buildFooAuthData())
        throw new Error('This should have thrown')
      } catch (err) {
        expect(ensureError(err).message).to.equal('Auth failure')
      }
    })
  })

  describe('Role validation', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rolesLookup: () => Promise<UserRoleData<any>[]> = async () => [
      { name: '1', weight: 1, description: '', public: false },
      { name: 'server:2', weight: 2, description: '', public: false },
      { name: '3', weight: 3, description: '', public: false },
      { name: 'goku', weight: 9001, description: '', public: false },
      { name: '42', weight: 42, description: '', public: false }
    ]

    const testData = [
      {
        name: 'Having lower privileged role than required results auth failed',
        requiredRole: 'server:2',
        context: { auth: true, role: '1' } as unknown as AuthContext,
        expectedResult: authFailed(
          buildEmptyContext(),
          new SFE('You do not have the required server role')
        )
      },
      {
        name: 'Not having auth fails role validation',
        requiredRole: 'server:2',
        context: { auth: false } as unknown as AuthContext,
        expectedResult: authFailed(
          buildEmptyContext(),
          new SUE('Must provide an auth token')
        )
      },
      {
        name: 'Requiring a junk role fails auth',
        requiredRole: 'knock knock...',
        context: { auth: true, role: '1' } as unknown as AuthContext,
        expectedResult: authFailed(
          buildEmptyContext(),
          new SFE('Invalid role requirement specified')
        )
      },
      {
        name: 'Having a junk role fails auth',
        requiredRole: 'server:2',
        context: { auth: true, role: 'iddqd' } as unknown as AuthContext,
        expectedResult: authFailed(
          buildEmptyContext(),
          new SFE('Your role is not valid')
        )
      },
      {
        name: 'Not having the required level fails',
        requiredRole: 'goku',
        context: { auth: true, role: '3' } as unknown as AuthContext,
        expectedResult: authFailed(
          buildEmptyContext(),
          new SFE('You do not have the required goku role')
        )
      },
      {
        name: 'Having the god mode role defeats even higher privilege requirement',
        requiredRole: 'goku',
        context: { auth: true, role: '42' } as unknown as AuthContext,
        expectedResult: buildEmptySuccess()
      },
      {
        name: 'Having equal role weight to required succeeds',
        requiredRole: '3',
        context: { auth: true, role: '3' } as unknown as AuthContext,
        expectedResult: buildEmptySuccess()
      },
      {
        name: 'Having bigger role weight than required succeeds',
        requiredRole: '3',
        context: { auth: true, role: 'goku' } as unknown as AuthContext,
        expectedResult: buildEmptySuccess()
      }
    ]

    testData.forEach((testCase) =>
      it(`${testCase.name}`, async () => {
        const step = validateRole({
          requiredRole: testCase.requiredRole as unknown as AvailableRoles,
          rolesLookup,
          iddqd: '42' as AvailableRoles,
          roleGetter: (context) => context.role || null
        })
        const { authResult, context } = await step({
          context: testCase.context,
          authResult: { authorized: false }
        })
        expect(authResult.authorized).to.exist
        expect(authResult.authorized).to.equal(
          testCase.expectedResult.authResult.authorized
        )

        if (
          isAuthFailedResult(authResult) ||
          isAuthFailedResult(testCase.expectedResult.authResult)
        ) {
          if (
            !isAuthFailedResult(authResult) ||
            !isAuthFailedResult(testCase.expectedResult.authResult)
          ) {
            throw new Error('AuthResult should be an auth failed result')
          }

          // this also needs to check for the error type... is this how do you do that in JS????
          expect(authResult.error?.name).to.equal(
            testCase.expectedResult.authResult.error?.name
          )
          expect(authResult.error?.message).to.equal(
            testCase.expectedResult.authResult.error?.message
          )
        }

        expect(context).to.deep.equal(testCase.context)
      })
    )
    it('Role validation fails if input authResult is already in an error state', async () => {
      const step = validateRole({
        requiredRole: 'goku' as AvailableRoles,
        rolesLookup,
        iddqd: '42' as AvailableRoles,
        roleGetter: (context) => context.role || null
      })
      const error = new SFE('This will be echoed back')
      const { authResult } = await step({
        context: buildEmptyContext(),
        authResult: { authorized: false, error } as AuthFailedResult
      })

      if (!isAuthFailedResult(authResult)) {
        throw new Error('AuthResult should be an auth failed result')
      }

      expect(authResult.authorized).to.be.false
      expect(authResult.error?.message).to.equal(error.message)
      expect(authResult.error?.name).to.equal(error.name)
    })
  })

  describe('Validate scopes', () => {
    it('Scope validation fails if input authResult is already in an error state', async () => {
      const step = validateScope({ requiredScope: 'play mahjong' })
      const expectedError = new SFE("Scope validation doesn't rescue the auth pipeline")
      const { authResult } = await step({
        context: buildEmptyContext(),
        authResult: { authorized: false, error: expectedError } as AuthFailedResult
      })

      if (!isAuthFailedResult(authResult)) {
        throw new Error('AuthResult should be an auth failed result')
      }

      expect(authResult.authorized).to.be.false
      expect(authResult.error?.message).to.equal(expectedError.message)
      expect(authResult.error?.name).to.equal(expectedError.name)
    })
    it('Without having any scopes on the context cannot validate scopes', async () => {
      const step = validateScope({ requiredScope: 'play mahjong' })
      const { authResult } = await step({
        context: buildEmptyContext(),
        authResult: { authorized: false }
      })

      if (!isAuthFailedResult(authResult)) {
        throw new Error('AuthResult should be an auth failed result')
      }

      expect(authResult.authorized).to.equal(false)
      const expectedError = new SFE(
        'Your auth token does not have the required scope: play mahjong.'
      )
      expect(authResult.error?.message).to.equal(expectedError.message)
      expect(authResult.error?.name).to.equal(expectedError.name)
    })
    it('Not having the right scopes results auth failed', async () => {
      const step = validateScope({ requiredScope: 'play mahjong' })
      const { authResult } = await step({
        context: { scopes: ['sit around and wait', 'try to be cool'] } as AuthContext,
        authResult: { authorized: false }
      })

      if (!isAuthFailedResult(authResult)) {
        throw new Error('AuthResult should be an auth failed result')
      }

      expect(authResult.authorized).to.equal(false)
      const expectedError = new SFE(
        'Your auth token does not have the required scope: play mahjong.'
      )

      expect(authResult.error?.message).to.equal(expectedError.message)
      expect(authResult.error?.name).to.equal(expectedError.name)
    })
    it('Having the right scopes results auth success', async () => {
      const step = validateScope({ requiredScope: 'play mahjong' })
      const { authResult } = await step({
        context: {
          scopes: ['sit around and wait', 'try to be cool', 'play mahjong']
        } as AuthContext,
        authResult: { authorized: false }
      })

      if (isAuthFailedResult(authResult)) {
        throw new Error('AuthResult should not be an auth failed result')
      }

      expect(authResult.authorized).to.equal(true)
    })
  })

  describe('Validate resource access', () => {
    it('Succeeds when no resource access rules present', async () => {
      const res = await validateResourceAccess({
        context: buildEmptyContext(),
        authResult: { authorized: false }
      })

      expect(res.authResult.authorized).to.be.true
    })

    it('Succeeds without a stream in the context, even if rules present', async () => {
      const res = await validateResourceAccess({
        context: {
          resourceAccessRules: [
            { id: 'foo', type: TokenResourceIdentifierType.Project }
          ]
        } as AuthContext,
        authResult: { authorized: false }
      })

      expect(res.authResult.authorized).to.be.true
    })

    it('Fails if authResult already failed', async () => {
      const res = await validateResourceAccess({
        context: {
          resourceAccessRules: [
            { id: 'foo', type: TokenResourceIdentifierType.Project }
          ]
        } as AuthContext,
        authResult: { authorized: false, error: new Error('dummy') } as AuthFailedResult
      })

      expect(res.authResult.authorized).to.be.false
    })

    it('Fails if resource access rules arent followed', async () => {
      const res = await validateResourceAccess({
        context: {
          resourceAccessRules: [
            { id: 'foo', type: TokenResourceIdentifierType.Project }
          ],
          stream: { id: 'bar' }
        } as AuthContext,
        authResult: { authorized: false }
      })

      if (!isAuthFailedResult(res.authResult)) {
        throw new Error('AuthResult should be an auth failed result')
      }

      expect(res.authResult.authorized).to.be.false
      expect(res.authResult.error?.message).to.equal(
        'You are not authorized to access this resource.'
      )
    })

    it('Succeeds if resource access rules are followed', async () => {
      const res = await validateResourceAccess({
        context: {
          resourceAccessRules: [
            { id: 'foo', type: TokenResourceIdentifierType.Project },
            { id: 'bar', type: TokenResourceIdentifierType.Project }
          ],
          stream: { id: 'bar' }
        } as AuthContext,
        authResult: { authorized: false }
      })

      expect(res.authResult.authorized).to.be.true
    })

    it('Success if resource access rules are defined, but are from a different type', async () => {
      const res = await validateResourceAccess({
        context: {
          resourceAccessRules: [
            { id: 'foo', type: 'fake' },
            { id: 'bar', type: 'fake' }
          ]
        } as unknown as AuthContext,
        authResult: { authorized: false }
      })

      expect(res.authResult.authorized).to.be.true
    })
  })

  describe('Context requires stream', () => {
    const expectAuthError = (expectedError: Error, authResult: AuthResult) => {
      if (!isAuthFailedResult(authResult)) {
        throw new Error('AuthResult should be an auth failed result')
      }

      expect(authResult.authorized).to.be.false
      expect(authResult.error).to.exist
      expect(authResult.error?.message).to.equal(expectedError.message)
      expect(authResult.error?.name).to.equal(expectedError.name)
    }
    it('Without streamId in the params it raises context error', async () => {
      const step = validateRequiredStreamFactory({
        getStream: async () => ({ ur: 'bamboozled' } as unknown as StreamRecord)
      })
      const { authResult } = await step({ params: {} } as AuthData)
      expectAuthError(
        new ContextError("The context doesn't have a streamId"),
        authResult
      )
    })
    it('If params is not defined it raises context error', async () => {
      const step = validateRequiredStreamFactory({
        getStream: async () => ({ ur: 'bamboozled' } as unknown as StreamRecord)
      })
      const { authResult } = await step({} as AuthData)
      expectAuthError(
        new ContextError("The context doesn't have a streamId"),
        authResult
      )
    })
    it('Stream is added to the returned context object', async () => {
      const demoStream = {
        id: 'foo',
        name: 'bar'
      } as StreamRecord

      const step = validateRequiredStreamFactory({
        getStream: async () => demoStream
      })
      const { context } = await step({
        context: buildEmptyContext(),
        params: { streamId: 'this is fake and its fine' }
      } as AuthData)
      expect(context.stream).to.deep.equal(demoStream)
    })
    it('If context is not defined return auth failure', async () => {
      const step = validateRequiredStreamFactory({
        getStream: async () => undefined
      })
      const { authResult } = await step({
        params: { streamId: 'the need for stream' }
      } as AuthData)

      expectAuthError(new ContextError('The context is not defined'), authResult)
    })
    it('If stream getter raises, the error is handled', async () => {
      const errorMessage = 'oh dangit'
      const step = validateRequiredStreamFactory({
        getStream: async () => {
          throw new Error(errorMessage)
        }
      })
      const { authResult } = await step({
        context: {},
        params: { streamId: 'the need for stream' }
      } as AuthData)

      expectAuthError(new ContextError(errorMessage), authResult)
    })
    it("If stream getter doesn't find a stream it returns fatal auth failure", async () => {
      const step = validateRequiredStreamFactory({
        getStream: async () => undefined
      })
      const { authResult } = await step({
        params: { streamId: 'the need for stream' },
        context: {}
      } as AuthData)

      expectAuthError(
        new NotFoundError(
          'Project ID is malformed and cannot be found, or the project does not exist',
          { info: { projectId: 'the need for stream' } }
        ),
        authResult
      )
    })
  })
  describe('Escape hatches', () => {
    describe('Admin override', () => {
      it('server:admins get authSuccess', async () => {
        const input = {
          context: { role: Roles.Server.Admin },
          authResult: 'fake'
        } as unknown as AuthData
        const result = await allowForServerAdmins(input)
        expect(result).to.deep.equal(authSuccess(input.context))
      })
      it('server:users get the previous authResult', async () => {
        const input = {
          context: { role: Roles.Server.User },
          authResult: 'fake'
        } as unknown as AuthData
        const result = await allowForServerAdmins(input)
        expect(result).to.deep.equal(input)
      })
    })
    describe('Allow for public stream no role', () => {
      it('not public stream, no auth returns same context ', async () => {
        const input = { context: 'dummy', authResult: 'fake' } as unknown as AuthData
        const result = await allowForRegisteredUsersOnPublicStreamsEvenWithoutRole(
          input
        )
        expect(result).to.deep.equal(input)
      })
      it('public stream, no auth returns same context ', async () => {
        const input = {
          context: { stream: { visibility: ProjectRecordVisibility.Public } },
          authResult: 'fake'
        } as unknown as AuthData
        const result = await allowForRegisteredUsersOnPublicStreamsEvenWithoutRole(
          input
        )
        expect(result).to.deep.equal(input)
      })
      it('not public stream, with auth returns same context ', async () => {
        const input = {
          context: {
            auth: true,
            stream: { visibility: ProjectRecordVisibility.Private }
          },
          authResult: 'fake'
        } as unknown as AuthData
        const result = await allowForRegisteredUsersOnPublicStreamsEvenWithoutRole(
          input
        )
        expect(result).to.deep.equal(input)
      })
      it('public stream, with auth returns authSuccess', async () => {
        const input = {
          context: {
            auth: true,
            stream: { visibility: ProjectRecordVisibility.Public }
          },
          authResult: 'fake'
        } as unknown as AuthData
        const result = await allowForRegisteredUsersOnPublicStreamsEvenWithoutRole(
          input
        )
        expect(result).to.deep.equal(authSuccess(input.context))
      })
    })
    describe('Allow for public stream public comments', () => {
      const sameContextTestData = [
        ['no stream, no auth', { context: 'dummy', authResult: 'fake' }],
        ['no stream, auth', { context: { auth: true }, authResult: 'fake' }],
        [
          'auth, private stream, private comments',
          {
            context: {
              auth: true,
              stream: {
                visibility: ProjectRecordVisibility.Private,
                allowPublicComments: false
              }
            },
            authResult: 'fake'
          }
        ],
        [
          'auth, private stream, public comments',
          {
            context: {
              auth: true,
              stream: {
                visibility: ProjectRecordVisibility.Private,
                allowPublicComments: true
              }
            },
            authResult: 'fake'
          }
        ],
        [
          'auth, private stream, public comments',
          {
            context: {
              auth: true,
              stream: {
                visibility: ProjectRecordVisibility.Private,
                allowPublicComments: true
              }
            },
            authResult: 'fake'
          }
        ],
        [
          'no auth, private stream, private comments',
          {
            context: {
              auth: false,
              stream: {
                visibility: ProjectRecordVisibility.Private,
                allowPublicComments: false
              }
            },
            authResult: 'fake'
          }
        ],
        [
          'no auth, public stream, private comments',
          {
            context: {
              auth: false,
              stream: {
                visibility: ProjectRecordVisibility.Public,
                allowPublicComments: false
              }
            },
            authResult: 'fake'
          }
        ],
        [
          'no auth, public stream, public comments',
          {
            context: {
              auth: false,
              stream: {
                visibility: ProjectRecordVisibility.Public,
                allowPublicComments: true
              }
            },
            authResult: 'fake'
          }
        ],
        [
          'no auth, public stream, private comments',
          {
            context: {
              auth: false,
              stream: {
                visibility: ProjectRecordVisibility.Public,
                allowPublicComments: false
              }
            },
            authResult: 'fake'
          }
        ],
        [
          'auth, public stream, private comments',
          {
            context: {
              auth: false,
              stream: {
                visibility: ProjectRecordVisibility.Public,
                allowPublicComments: false
              }
            },
            authResult: 'fake'
          }
        ]
      ]
      sameContextTestData.map(([caseName, context]) =>
        it(`${caseName} returns same context`, async () => {
          const result =
            await allowForAllRegisteredUsersOnPublicStreamsWithPublicComments(
              context as unknown as AuthData
            )
          expect(result).to.deep.equal(context)
        })
      )
      it(`Auth public stream public comments returns authSuccess`, async () => {
        const input = {
          context: {
            auth: true,
            stream: {
              visibility: ProjectRecordVisibility.Public,
              allowPublicComments: true
            }
          },
          authResult: 'fake'
        } as unknown as AuthData
        const result =
          await allowForAllRegisteredUsersOnPublicStreamsWithPublicComments(input)
        expect(result).to.deep.equal(authSuccess(input.context))
      })
    })
  })
})
