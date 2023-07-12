import { createPage } from '@nuxt/test-utils'
import { describe, it, expect, beforeAll } from 'vitest'
import { setupE2eTest, ensureServerRunning } from '../helpers/e2e'

// Basic nuxt e2e test with vitest
describe('viewer', async () => {
  await setupE2eTest()

  beforeAll(async () => {
    await ensureServerRunning()
    // TODO: Ensure proj exists
  })

  it('renders the viewer', async () => {
    const page = await createPage('/projects/9387e7e4c2/models/51c7c5b8eb')
    await page.waitForSelector('.viewer-anchored-points')
    const content = await page.content()

    expect(content).toMatch('helloworld')
  }, 100000)
})
