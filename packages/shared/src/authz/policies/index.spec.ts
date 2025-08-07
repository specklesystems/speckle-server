/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { describe, expect, it } from 'vitest'
import { authPoliciesFactory } from './index.js'

describe('authPoliciesFactory', () => {
  it('builds and contains policies', () => {
    const policies = authPoliciesFactory({} as any) // fake loaders
    expect(policies.project.canLeave).toBeDefined()
    expect(policies.automate.function.canRegenerateToken).toBeDefined()
    expect(policies.workspace.canInvite).toBeDefined()
  })
})
