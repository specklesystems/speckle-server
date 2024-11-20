const expect = require('chai').expect
const {
  authPipelineCreator,
  authFailed,
  authSuccess,
  validateRole,
  validateScope,
  allowForAllRegisteredUsersOnPublicStreamsWithPublicComments,
  allowForRegisteredUsersOnPublicStreamsEvenWithoutRole,
  allowForServerAdmins,
  validateResourceAccess,
  validateRequiredStreamFactory
} = require('@/modules/shared/authz')
const {
  ForbiddenError: SFE,
  UnauthorizedError: SUE,
  UnauthorizedError,
  ContextError,
  NotFoundError
} = require('@/modules/shared/errors')
const { Roles } = require('@speckle/shared')
const {
  TokenResourceIdentifierType
} = require('@/modules/core/graph/generated/graphql')

describe('AuthZ @shared', () => {
  describe('Auth pipeline', () => {
    it('Empty pipeline returns no authorization', async () => {
      const pipeline = authPipelineCreator([])
      const { authResult } = await pipeline({ context: { foo: 'bar' } })
      expect(authResult.authorized).to.equal(false)
    })
    it('Pipeline breaks on fatal error', async () => {
      const errorMessage = 'dummy'
      const fatalFail = async () => authFailed({}, new Error(errorMessage), true)
      const shouldRescue = async () => authSuccess()
      const pipeline = authPipelineCreator([shouldRescue, fatalFail, shouldRescue])
      const { authResult } = await pipeline({ context: { foo: 'bar' } })
      expect(authResult.authorized).to.equal(false)
      expect(authResult.fatal).to.equal(true)
      expect(authResult.error.message).to.equal(errorMessage)
    })
    it('Pipeline continues for non fatal errors', async () => {
      const nonFatalFail = async () => authFailed({}, new Error('errorMessage'), false)
      const shouldRescue = async () => authSuccess()
      const pipeline = authPipelineCreator([shouldRescue, nonFatalFail, shouldRescue])
      const { authResult } = await pipeline({ context: { foo: 'bar' } })
      expect(authResult.authorized).to.equal(true)
      expect(authResult.fatal).to.not.exist
      expect(authResult.error).to.not.exist
    })
    it('Pipeline throws Error if authorized but has error', async () => {
      const borkedStep = async () => ({
        authResult: {
          authorized: true,
          error: new UnauthorizedError('Weird stuff'),
          fatal: false
        }
      })
      const pipeline = authPipelineCreator([borkedStep])
      try {
        await pipeline({ context: { foo: 'bar' } })
        throw new Error('This should have thrown')
      } catch (err) {
        expect(err.message).to.equal('Auth failure')
      }
    })
  })

  describe('Role validation', () => {
    const rolesLookup = async () => [
      { name: '1', weight: 1 },
      { name: 'server:2', weight: 2 },
      { name: '3', weight: 3 },
      { name: 'goku', weight: 9001 },
      { name: '42', weight: 42 }
    ]

    const testData = [
      {
        name: 'Having lower privileged role than required results auth failed',
        requiredRole: 'server:2',
        context: { auth: true, role: '1' },
        expectedResult: authFailed(
          null,
          new SFE('You do not have the required server role')
        )
      },
      {
        name: 'Not having auth fails role validation',
        requiredRole: 'server:2',
        context: { auth: false },
        expectedResult: authFailed(null, new SUE('Must provide an auth token'))
      },
      {
        name: 'Requiring a junk role fails auth',
        requiredRole: 'knock knock...',
        context: { auth: true, role: '1' },
        expectedResult: authFailed(null, new SFE('Invalid role requirement specified'))
      },
      {
        name: 'Having a junk role fails auth',
        requiredRole: 'server:2',
        context: { auth: true, role: 'iddqd' },
        expectedResult: authFailed(null, new SFE('Your role is not valid'))
      },
      {
        name: 'Not having the required level fails',
        requiredRole: 'goku',
        context: { auth: true, role: '3' },
        expectedResult: authFailed(
          null,
          new SFE('You do not have the required goku role')
        )
      },
      {
        name: 'Having the god mode role defeats even higher privilege requirement',
        requiredRole: 'goku',
        context: { auth: true, role: '42' },
        expectedResult: authSuccess()
      },
      {
        name: 'Having equal role weight to required succeeds',
        requiredRole: '3',
        context: { auth: true, role: '3' },
        expectedResult: authSuccess()
      },
      {
        name: 'Having bigger role weight than required succeeds',
        requiredRole: '3',
        context: { auth: true, role: 'goku' },
        expectedResult: authSuccess()
      }
    ]

    testData.forEach((testCase) =>
      it(`${testCase.name}`, async () => {
        const step = validateRole({
          requiredRole: testCase.requiredRole,
          rolesLookup,
          iddqd: '42',
          roleGetter: (context) => context.role
        })
        const { authResult, context } = await step({
          context: testCase.context,
          authResult: authFailed()
        })
        expect(authResult.authorized).to.exist
        expect(authResult.authorized).to.equal(
          testCase.expectedResult.authResult.authorized
        )
        // this also needs to check for the error type... is this how do you do that in JS????
        expect(authResult.error?.name).to.equal(
          testCase.expectedResult.authResult.error?.name
        )
        expect(authResult.error?.message).to.equal(
          testCase.expectedResult.authResult.error?.message
        )
        expect(context).to.deep.equal(testCase.context)
      })
    )
    it('Role validation fails if input authResult is already in an error state', async () => {
      const step = validateRole({ requiredRole: 'goku', rolesLookup, iddqd: '42' })
      const error = new SFE('This will be echoed back')
      const { authResult } = await step({
        context: {},
        authResult: { authorized: false, error }
      })
      expect(authResult.authorized).to.be.false
      expect(authResult.error.message).to.equal(error.message)
      expect(authResult.error.name).to.equal(error.name)
    })
  })

  describe('Validate scopes', () => {
    it('Scope validation fails if input authResult is already in an error state', async () => {
      const step = validateScope({ requiredScope: 'play mahjong' })
      const expectedError = new SFE("Scope validation doesn't rescue the auth pipeline")
      const { authResult } = await step({
        context: {},
        authResult: { authorized: false, error: expectedError }
      })
      expect(authResult.authorized).to.be.false
      expect(authResult.error.message).to.equal(expectedError.message)
      expect(authResult.error.name).to.equal(expectedError.name)
    })
    it('Without having any scopes on the context cannot validate scopes', async () => {
      const step = validateScope({ requiredScope: 'play mahjong' })
      const { authResult } = await step({ context: {}, authResult: {} })
      expect(authResult.authorized).to.equal(false)
      const expectedError = new SFE(
        'Your auth token does not have the required scope: play mahjong.'
      )
      expect(authResult.error.message).to.equal(expectedError.message)
      expect(authResult.error.name).to.equal(expectedError.name)
    })
    it('Not having the right scopes results auth failed', async () => {
      const step = validateScope({ requiredScope: 'play mahjong' })
      const { authResult } = await step({
        context: { scopes: ['sit around and wait', 'try to be cool'] },
        authResult: {}
      })
      expect(authResult.authorized).to.equal(false)
      const expectedError = new SFE(
        'Your auth token does not have the required scope: play mahjong.'
      )

      expect(authResult.error.message).to.equal(expectedError.message)
      expect(authResult.error.name).to.equal(expectedError.name)
    })
    it('Having the right scopes results auth success', async () => {
      const step = validateScope({ requiredScope: 'play mahjong' })
      const { authResult } = await step({
        context: { scopes: ['sit around and wait', 'try to be cool', 'play mahjong'] },
        authResult: {}
      })
      expect(authResult.authorized).to.equal(true)
      expect(authResult.error).to.not.exist
    })
  })

  describe('Validate resource access', () => {
    it('Succeeds when no resource access rules present', async () => {
      const res = await validateResourceAccess({
        context: {},
        authResult: {}
      })

      expect(res.authResult.authorized).to.be.true
    })

    it('Succeeds without a stream in the context, even if rules present', async () => {
      const res = await validateResourceAccess({
        context: {
          resourceAccessRules: [
            { id: 'foo', type: TokenResourceIdentifierType.Project }
          ]
        },
        authResult: {}
      })

      expect(res.authResult.authorized).to.be.true
    })

    it('Fails if authResult already failed', async () => {
      const res = await validateResourceAccess({
        context: {
          resourceAccessRules: [
            { id: 'foo', type: TokenResourceIdentifierType.Project }
          ]
        },
        authResult: { authorized: false, error: new Error('dummy') }
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
        },
        authResult: {}
      })

      expect(res.authResult.authorized).to.be.false
      expect(res.authResult.error.message).to.equal(
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
        },
        authResult: {}
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
        },
        authResult: {}
      })

      expect(res.authResult.authorized).to.be.true
    })
  })

  describe('Context requires stream', () => {
    const expectAuthError = (expectedError, authResult) => {
      expect(authResult.authorized).to.be.false
      expect(authResult.error).to.exist
      expect(authResult.error.message).to.equal(expectedError.message)
      expect(authResult.error.name).to.equal(expectedError.name)
    }
    it('Without streamId in the params it raises context error', async () => {
      const step = validateRequiredStreamFactory({
        getStream: async () => ({ ur: 'bamboozled' }),
        getAutomationProject: async () => null
      })
      const { authResult } = await step({ params: {} })
      expectAuthError(
        new ContextError("The context doesn't have a streamId or automationId"),
        authResult
      )
    })
    it('If params is not defined it raises context error', async () => {
      const step = validateRequiredStreamFactory({
        getStream: async () => ({ ur: 'bamboozled' }),
        getAutomationProject: async () => null
      })
      const { authResult } = await step({})
      expectAuthError(
        new ContextError("The context doesn't have a streamId or automationId"),
        authResult
      )
    })
    it('Stream is added to the returned context object', async () => {
      const demoStream = {
        id: 'foo',
        name: 'bar'
      }
      const step = validateRequiredStreamFactory({
        getStream: async () => demoStream,
        getAutomationProject: async () => null
      })
      const { context } = await step({
        context: {},
        params: { streamId: 'this is fake and its fine' }
      })
      expect(context.stream).to.deep.equal(demoStream)
    })
    it('If context is not defined return auth failure', async () => {
      const step = validateRequiredStreamFactory({
        getStream: async () => {},
        getAutomationProject: async () => null
      })
      const { authResult } = await step({ params: { streamId: 'the need for stream' } })

      expectAuthError(new ContextError('The context is not defined'), authResult)
    })
    it('If stream getter raises, the error is handled', async () => {
      const errorMessage = 'oh dangit'
      const step = validateRequiredStreamFactory({
        getStream: async () => {
          throw new Error(errorMessage)
        },
        getAutomationProject: async () => null
      })
      const { authResult } = await step({
        context: {},
        params: { streamId: 'the need for stream' }
      })

      expectAuthError(new ContextError(errorMessage), authResult)
    })
    it("If stream getter doesn't find a stream it returns fatal auth failure", async () => {
      const step = validateRequiredStreamFactory({
        getStream: async () => {},
        getAutomationProject: async () => null
      })
      const { authResult } = await step({
        params: { streamId: 'the need for stream' },
        context: {}
      })

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
        const input = { context: { role: Roles.Server.Admin }, authResult: 'fake' }
        const result = await allowForServerAdmins(input)
        expect(result).to.deep.equal(authSuccess(input.context))
      })
      it('server:users get the previous authResult', async () => {
        const input = { context: { role: Roles.Server.User }, authResult: 'fake' }
        const result = await allowForServerAdmins(input)
        expect(result).to.deep.equal(input)
      })
    })
    describe('Allow for public stream no role', () => {
      it('not public stream, no auth returns same context ', async () => {
        const input = { context: 'dummy', authResult: 'fake' }
        const result = await allowForRegisteredUsersOnPublicStreamsEvenWithoutRole(
          input
        )
        expect(result).to.deep.equal(input)
      })
      it('public stream, no auth returns same context ', async () => {
        const input = { context: { stream: { isPublic: true } }, authResult: 'fake' }
        const result = await allowForRegisteredUsersOnPublicStreamsEvenWithoutRole(
          input
        )
        expect(result).to.deep.equal(input)
      })
      it('not public stream, with auth returns same context ', async () => {
        const input = {
          context: { auth: true, stream: { isPublic: false } },
          authResult: 'fake'
        }
        const result = await allowForRegisteredUsersOnPublicStreamsEvenWithoutRole(
          input
        )
        expect(result).to.deep.equal(input)
      })
      it('public stream, with auth returns authSuccess', async () => {
        const input = {
          context: { auth: true, stream: { isPublic: true } },
          authResult: 'fake'
        }
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
              stream: { isPublic: false, allowPublicComments: false }
            },
            authResult: 'fake'
          }
        ],
        [
          'auth, private stream, public comments',
          {
            context: {
              auth: true,
              stream: { isPublic: false, allowPublicComments: true }
            },
            authResult: 'fake'
          }
        ],
        [
          'auth, private stream, public comments',
          {
            context: {
              auth: true,
              stream: { isPublic: false, allowPublicComments: true }
            },
            authResult: 'fake'
          }
        ],
        [
          'no auth, private stream, private comments',
          {
            context: {
              auth: false,
              stream: { isPublic: false, allowPublicComments: false }
            },
            authResult: 'fake'
          }
        ],
        [
          'no auth, public stream, private comments',
          {
            context: {
              auth: false,
              stream: { isPublic: true, allowPublicComments: false }
            },
            authResult: 'fake'
          }
        ],
        [
          'no auth, public stream, public comments',
          {
            context: {
              auth: false,
              stream: { isPublic: true, allowPublicComments: true }
            },
            authResult: 'fake'
          }
        ],
        [
          'no auth, public stream, private comments',
          {
            context: {
              auth: false,
              stream: { isPublic: true, allowPublicComments: false }
            },
            authResult: 'fake'
          }
        ],
        [
          'auth, public stream, private comments',
          {
            context: {
              auth: false,
              stream: { isPublic: true, allowPublicComments: false }
            },
            authResult: 'fake'
          }
        ]
      ]
      sameContextTestData.map(([caseName, context]) =>
        it(`${caseName} returns same context`, async () => {
          const result =
            await allowForAllRegisteredUsersOnPublicStreamsWithPublicComments(context)
          expect(result).to.deep.equal(context)
        })
      )
      it(`Auth public stream public comments returns authSuccess`, async () => {
        const input = {
          context: {
            auth: true,
            stream: { isPublic: true, allowPublicComments: true }
          },
          authResult: 'fake'
        }
        const result =
          await allowForAllRegisteredUsersOnPublicStreamsWithPublicComments(input)
        expect(result).to.deep.equal(authSuccess(input.context))
      })
    })
  })
})
