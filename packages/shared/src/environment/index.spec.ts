import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { parseFeatureFlags } from './index.js'
import { FeatureFlags } from './featureFlags.js'

const originalDisableAllFfs = process.env.DISABLE_ALL_FFS || ''
const originalEnableAllFfs = process.env.ENABLE_ALL_FFS || ''

const setDisableAllFfs = (value: boolean) => {
  process.env.DISABLE_ALL_FFS = value.toString()
}

const setEnableAllFfs = (value: boolean) => {
  process.env.ENABLE_ALL_FFS = value.toString()
}

const resetEnv = () => {
  process.env.DISABLE_ALL_FFS = originalDisableAllFfs
  process.env.ENABLE_ALL_FFS = originalEnableAllFfs
}

describe('parseFeatureFlags', () => {
  beforeEach(() => {
    // Disable global "ALL FFs"/"NO FFs" modes for these tests, cause they break em
    setDisableAllFfs(false)
    setEnableAllFfs(false)
  })

  afterEach(() => {
    resetEnv()
  })

  it('returns all defaults as false', () => {
    const flags = parseFeatureFlags({})
    for (const key of Object.keys(flags)) {
      expect(flags[key as keyof FeatureFlags]).toBe(false)
    }
  })

  it('parses explicit true/false values', () => {
    const flags = parseFeatureFlags({
      FF_AUTOMATE_MODULE_ENABLED: 'true',
      FF_GENDOAI_MODULE_ENABLED: 'false',
      FF_SAVED_VIEWS_ENABLED: 'true'
    })
    expect(flags.FF_AUTOMATE_MODULE_ENABLED).toBe(true)
    expect(flags.FF_GENDOAI_MODULE_ENABLED).toBe(false)
    expect(flags.FF_SAVED_VIEWS_ENABLED).toBe(true)
  })

  it('DISABLE_ALL_FFS disables all flags unless forceInputs is true', () => {
    setDisableAllFfs(true)
    const flags = parseFeatureFlags(
      {
        FF_AUTOMATE_MODULE_ENABLED: 'true',
        FF_SAVED_VIEWS_ENABLED: 'true'
      },
      { forceInputs: false }
    )
    for (const key of Object.keys(flags)) {
      expect(flags[key as keyof FeatureFlags]).toBe(false)
    }
  })

  it('ENABLE_ALL_FFS enables all flags unless forceInputs is true', () => {
    setEnableAllFfs(true)
    const flags = parseFeatureFlags(
      {
        FF_AUTOMATE_MODULE_ENABLED: 'false',
        FF_SAVED_VIEWS_ENABLED: 'false'
      },
      { forceInputs: false }
    )
    for (const key of Object.keys(flags)) {
      expect(flags[key as keyof FeatureFlags]).toBe(true)
    }
  })

  it('forceInputs=true preserves explicit input values even with DISABLE_ALL_FFS', () => {
    setDisableAllFfs(true)
    const flags = parseFeatureFlags(
      {
        FF_AUTOMATE_MODULE_ENABLED: 'true',
        FF_SAVED_VIEWS_ENABLED: 'false'
      },
      { forceInputs: true }
    )

    expect(flags.FF_AUTOMATE_MODULE_ENABLED).toBe(true)
    expect(flags.FF_SAVED_VIEWS_ENABLED).toBe(false)
    // All others should be false
    for (const key of Object.keys(flags)) {
      if (key !== 'FF_AUTOMATE_MODULE_ENABLED' && key !== 'FF_SAVED_VIEWS_ENABLED') {
        expect(flags[key as keyof FeatureFlags]).toBe(false)
      }
    }
  })

  it('forceInputs=true preserves explicit input values even with ENABLE_ALL_FFS', () => {
    setEnableAllFfs(true)
    const flags = parseFeatureFlags(
      {
        FF_AUTOMATE_MODULE_ENABLED: 'false',
        FF_SAVED_VIEWS_ENABLED: 'true'
      },
      { forceInputs: true }
    )

    expect(flags.FF_AUTOMATE_MODULE_ENABLED).toBe(false)
    expect(flags.FF_SAVED_VIEWS_ENABLED).toBe(true)
    // All others should be true
    for (const key of Object.keys(flags)) {
      if (key !== 'FF_AUTOMATE_MODULE_ENABLED' && key !== 'FF_SAVED_VIEWS_ENABLED') {
        expect(flags[key as keyof FeatureFlags]).toBe(true)
      }
    }
  })

  it('it can handle empty string env vars', () => {
    const flags = parseFeatureFlags({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      FF_AUTOMATE_MODULE_ENABLED: ''
    })
    expect(flags.FF_AUTOMATE_MODULE_ENABLED).toBe(false)
  })
})
