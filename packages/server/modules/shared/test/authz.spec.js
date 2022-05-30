const {
  authPipelineCreator,
  authFailed,
  authSuccess,
  validateRole
} = require('@/modules/shared/authz')
const expect = require('chai').expect

describe('AuthZ @shared', () => {
  it('Empty pipeline returns no authorization', async () => {
    const pipeline = authPipelineCreator([])
    const authResult = await pipeline({ context: { foo: 'bar' } })
    expect(authResult.authorized).to.equal(false)
  })

  describe('Role validation', () => {
    const roles = [
      { name: '1', weight: 1 },
      { name: '2', weight: 2 },
      { name: 'goku', weight: 9001 },
      { name: '42', weight: 42 }
    ]

    const testData = [
      {
        name: 'Having lower privileged role than required results auth failed',
        requiredRole: '2',
        context: { auth: true, role: '1' },
        expectedResult: authFailed()
      },
      {
        name: 'Having the god mode role defeats even higher privilege requirement',
        requiredRole: 'goku',
        context: { auth: true, role: '42' },
        expectedResult: authSuccess()
      }
    ]

    testData.forEach((testCase) =>
      it(`${testCase.name}`, async () => {
        const step = validateRole({ requiredRole: 'goku', roles, iddqd: '42' })
        const authResult = await step({
          context: testCase.context,
          authResult: authFailed()
        })
        expect(authResult).to.deep.equal(testCase.expectedResult)
      })
    )
  })
})
