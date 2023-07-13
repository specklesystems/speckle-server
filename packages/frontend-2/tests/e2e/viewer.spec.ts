import { createPage } from '@nuxt/test-utils'
import { describe, it, expect, beforeAll } from 'vitest'
import {
  setupE2eTest,
  ensureServerRunning,
  ensureE2eTestProject,
  TestProjectMetadata,
  buildTestProjectHelpers,
  TestProjectHelpers
} from '../helpers/e2e'

// TODO: Page creation in beforeAll doesn't seem to work
// TODO: Re-use page between tests for quicker runtime

const initializePage = async (testProjectHelpers: TestProjectHelpers) => {
  const page = await createPage(testProjectHelpers.modelPagePath)
  await page.waitForSelector('.viewer-base--initialized')
  return page
}

// Basic nuxt e2e test with vitest
describe('Viewer', async () => {
  await setupE2eTest()

  let testProjectMetadata: TestProjectMetadata
  let testProjectHelpers: TestProjectHelpers

  beforeAll(async () => {
    await ensureServerRunning()
    testProjectMetadata = await ensureE2eTestProject()
    testProjectHelpers = buildTestProjectHelpers(testProjectMetadata)
  })

  it('gets rendered', async () => {
    const page = await initializePage(testProjectHelpers)

    // Check if child element is a canvas
    const canvas = await page.$('.viewer-base--initialized > div > canvas')
    expect(canvas).toBeTruthy()
  }, 100000)

  describe('thread bubbles', () => {
    it('get rendered', async () => {
      const page = await initializePage(testProjectHelpers)

      const bubbleButtons = await page.$$('.anchored-point-thread-button')
      expect(bubbleButtons.length).toBeGreaterThan(0)
    })

    it('open thread when clicked', async () => {
      const page = await initializePage(testProjectHelpers)

      const bubbleButton = await page.$('.anchored-point-thread-button')
      expect(bubbleButton).toBeTruthy()

      const threadId = await bubbleButton!.getAttribute('data-thread-id')
      expect(threadId).toBeTruthy()

      await bubbleButton!.click()
      await page.waitForSelector(
        `.anchored-point-thread-contents[data-thread-id="${threadId!}"]`
      )
    })
  })
})
