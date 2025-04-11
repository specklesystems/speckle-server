/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import { expect } from 'vitest'
import { AllAuthErrors, isAuthPolicyError } from '../authz/index.js'
import { isInstance as isResult } from 'true-myth/result'
import { isInstance as isMaybe } from 'true-myth/maybe'
import { isString } from '#lodash'

// Augment vitest types w/ new matchers
interface CustomMatchers<R = unknown> {
  toBeAuthOKResult: () => R
  toBeAuthErrorResult: (params: {
    /**
     * Check for specific error code
     */
    code?: AllAuthErrors['code']

    /**
     * Check for specific error message
     */
    message?: string | RegExp

    /**
     * Check for a specific payload
     */
    payload?: unknown
  }) => R
  toBeNothingResult: () => R
  toBeOKResult: (params?: {
    /**
     * Optionally check for specific value
     */
    value?: unknown
  }) => R
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

// Extend w/ extra matchers
expect.extend({
  toBeOKResult(
    received: unknown,
    expected: Parameters<CustomMatchers['toBeOKResult']>[0]
  ) {
    if (isMaybe(received) && received.isJust) {
      received = received.value
    }

    if (!isResult(received)) {
      return {
        pass: false,
        message: () => `Expected ${received} to be a Result structure`
      }
    }

    if (!received.isOk) {
      return {
        pass: false,
        message: () => `Expected ${received} to be an OK Result`
      }
    }

    if (expected?.value) {
      const equals = this.equals(received.value, expected.value)
      if (!equals) {
        return {
          pass: false,
          message: () =>
            `Expected ${received} to be an OK Result with value ${expected.value}`,
          expected: expected.value,
          actual: received.value
        }
      }
    }

    return {
      pass: true,
      message: () => `${received} is an OK Result`
    }
  },
  toBeAuthOKResult(received: unknown) {
    if (isMaybe(received) && received.isJust) {
      received = received.value
    }

    if (!isResult(received)) {
      return {
        pass: false,
        message: () => `Expected ${received} to be a Result structure`
      }
    }

    if (!received.isOk) {
      return {
        pass: false,
        message: () => `Expected ${received} to be an OK Result`
      }
    }

    return {
      pass: true,
      message: () => `${received} is an OK Result`
    }
  },
  toBeAuthErrorResult(
    received: unknown,
    expected: Parameters<CustomMatchers['toBeAuthErrorResult']>[0]
  ) {
    const { code, message, payload } = expected
    if (!code?.length && !message && !payload) {
      throw new Error(
        'No expected value provided. Either code or message or payload must be set.'
      )
    }

    if (isMaybe(received) && received.isJust) {
      received = received.value
    }

    if (!isResult(received)) {
      return {
        pass: false,
        message: () => `Expected ${received} to be a Result structure`
      }
    }

    if (!received.isErr) {
      return {
        pass: false,
        message: () => `Expected ${received} to be an Error Result`
      }
    }

    if (!isAuthPolicyError(received.error)) {
      return {
        pass: false,
        message: () => `Expected ${received} to be an Error Result with an AuthError`
      }
    }

    // Sanity checks done, now do actual expectation checks
    if (expected.code && received.error.code !== expected.code) {
      return {
        pass: false,
        message: () =>
          `Expected ${received} to be an Auth Error Result with code ${expected.code}`,
        expected: expected.code,
        actual: received.error.code
      }
    }

    if (expected.message) {
      const messageDoesntFit = isString(expected.message)
        ? !expected.message.includes(expected.message)
        : !expected.message.test(received.error.message)
      if (messageDoesntFit) {
        return {
          pass: false,
          message: () =>
            `Expected ${received} to be an Auth Error Result with message substring '${expected.message}'`,
          expected: expected.message,
          actual: received.error.message
        }
      }
    }

    if (expected.payload) {
      const errPayload = received.error.payload
      const equals = this.equals(errPayload, expected.payload)
      if (!equals) {
        return {
          pass: false,
          message: () =>
            `Expected ${received} to be an Auth Error Result with payload ${expected.payload}`,
          expected: expected.payload,
          actual: errPayload
        }
      }
    }

    return {
      pass: true,
      message: () => `${received} is an Auth Error Result with code ${expected.code}`
    }
  },
  toBeNothingResult(received: unknown) {
    if (!isMaybe(received)) {
      return {
        pass: false,
        message: () => `Expected ${received} to be a Maybe structure`
      }
    }

    if (received.isJust) {
      return {
        pass: false,
        message: () => `Expected ${received} to be a Nothing Result`
      }
    }

    return {
      pass: true,
      message: () => `${received} is a Nothing Result`
    }
  }
})
