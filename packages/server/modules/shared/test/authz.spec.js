const expect = require('chai').expect
const {
  authPipelineCreator,
  authFailed,
  authSuccess,
  validateRole,
  validateScope,
  contextRequiresStream,
  ContextError
} = require('@/modules/shared/authz')
const {
  SpeckleForbiddenError: SFE,
  UnauthorizedError: SUE
} = require('@/modules/shared/errors')

describe('AuthZ @shared', () => {
  it('Empty pipeline returns no authorization', async () => {
    const pipeline = authPipelineCreator([])
    const { authResult } = await pipeline({ context: { foo: 'bar' } })
    expect(authResult.authorized).to.equal(false)
  })

  describe('Role validation', () => {
    const rolesLookup = async () => [
      { name: '1', weight: 1 },
      { name: '2', weight: 2 },
      { name: '3', weight: 3 },
      { name: 'goku', weight: 9001 },
      { name: '42', weight: 42 }
    ]

    const testData = [
      {
        name: 'Having lower privileged role than required results auth failed',
        requiredRole: '2',
        context: { auth: true, role: '1' },
        expectedResult: authFailed(null, new SFE('You do not have the required role'))
      },
      {
        name: 'Not having auth fails role validation',
        requiredRole: '2',
        context: { auth: false },
        expectedResult: authFailed(null, new SUE('Cannot validate role without auth'))
      },
      {
        name: 'Requiring a junk role fails auth',
        requiredRole: 'knock knock...',
        context: { auth: true, role: '1' },
        expectedResult: authFailed(null, new SFE('Invalid role requirement specified'))
      },
      {
        name: 'Having a junk role fails auth',
        requiredRole: '2',
        context: { auth: true, role: 'iddqd' },
        expectedResult: authFailed(null, new SFE('Your role is not valid'))
      },
      {
        name: 'Not having the required level fails',
        requiredRole: 'goku',
        context: { auth: true, role: '3' },
        expectedResult: authFailed(null, new SFE('You do not have the required role'))
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
      const expectedError = new SFE('You do not have the required privileges.')
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
      const expectedError = new SFE('You do not have the required privileges.')

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

  describe('Context requires stream', () => {
    const expectAuthError = (expectedError, authResult) => {
      expect(authResult.authorized).to.be.false
      expect(authResult.error).to.exist
      expect(authResult.error.message).to.equal(expectedError.message)
      expect(authResult.error.name).to.equal(expectedError.name)
    }
    it('Without streamId in the params it raises context error', async () => {
      const step = contextRequiresStream(async () => ({ ur: 'bamboozled' }))
      const { authResult } = await step({ params: {} })
      expectAuthError(
        new ContextError("The context doesn't have a streamId"),
        authResult
      )
    })
    it('If params is not defined it raises context error', async () => {
      const step = contextRequiresStream(async () => ({ ur: 'bamboozled' }))
      const { authResult } = await step({})
      expectAuthError(
        new ContextError("The context doesn't have a streamId"),
        authResult
      )
    })
    it('Stream is added to the returned context object', async () => {
      const demoStream = {
        id: 'foo',
        name: 'bar'
      }
      const step = contextRequiresStream(async () => demoStream)
      const { context } = await step({
        context: {},
        params: { streamId: 'this is fake and its fine' }
      })
      expect(context.stream).to.deep.equal(demoStream)
    })
    it('If context is not defined return auth failure', async () => {
      const step = contextRequiresStream(async () => {})
      const { authResult } = await step({ params: { streamId: 'the need for stream' } })

      expectAuthError(new ContextError('The context is not defined'), authResult)
    })
    it('If stream getter raises, the error is handled', async () => {
      const errorMessage = 'oh dangit'
      const step = contextRequiresStream(async () => {
        throw new Error(errorMessage)
      })
      const { authResult } = await step({
        context: {},
        params: { streamId: 'the need for stream' }
      })

      expectAuthError(new ContextError(errorMessage), authResult)
    })
  })
})
