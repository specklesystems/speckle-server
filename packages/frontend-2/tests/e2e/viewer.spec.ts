import { createPage } from '@nuxt/test-utils'
import { describe, it, expect, beforeAll } from 'vitest'
import {
  setupE2eTest,
  ensureServerRunning,
  ensureE2eTestProject,
  TestProjectMetadata,
  buildTestProjectHelpers
} from '../helpers/e2e'

// TODO: Page creation in beforeAll doesn't seem to work
// TODO: Re-use page between tests for quicker runtime

const initializePage = async (testProjectMetadata: TestProjectMetadata) => {
  const testProjectHelpers = buildTestProjectHelpers(testProjectMetadata)
  const page = await createPage(testProjectHelpers.modelPagePath)

  try {
    const viewerBaseInitialized = page.locator('.viewer-base--initialized')
    await viewerBaseInitialized.waitFor()
  } catch (e) {
    console.error('Waiting for viewer initialization failed:')
    console.error(await page.evaluate(() => document.body.innerHTML))
    console.error(testProjectMetadata)
    throw e
  }

  return page
}

// Basic nuxt e2e test with vitest
describe('Viewer', async () => {
  await setupE2eTest()

  let testProjectMetadata: TestProjectMetadata

  beforeAll(async () => {
    await ensureServerRunning()
    testProjectMetadata = await ensureE2eTestProject()
  })

  it('gets rendered', async () => {
    const page = await initializePage(testProjectMetadata)

    // Check if child element is a canvas
    const canvas = await page.$('.viewer-base--initialized > div > canvas')
    expect(canvas).toBeTruthy()
  }, 100000)

  it('side tabs can be toggled', async () => {
    const page = await initializePage(testProjectMetadata)

    const controls = page.locator('.viewer-controls')
    await controls.waitFor()

    // Models opened up by default
    const modelsBtn = controls.locator(
      'button[data-button-type="models"][data-is-active="true"]'
    )
    expect(await modelsBtn.evaluate((el) => el !== null)).toBe(true)

    // Clicking it sets data-is-active to false
    await modelsBtn.click()
    const activeBtns = controls.locator(
      'button[data-button-type][data-is-active="true"]'
    )
    expect(await activeBtns.count()).toBe(0)
  })

  describe('thread bubbles', () => {
    it('get rendered', async () => {
      const page = await initializePage(testProjectMetadata)

      const anchoredPoints = page.locator('.viewer-anchored-points')
      await anchoredPoints.waitFor()

      const bubbleButtons = await page.$$('.anchored-point-thread-button')
      expect(bubbleButtons.length).toBeGreaterThan(0)
    })

    it('open thread when clicked', async () => {
      const page = await initializePage(testProjectMetadata)

      const anchoredPoints = page.locator('.viewer-anchored-points')
      await anchoredPoints.waitFor()

      const bubbleButton = await page.$('.anchored-point-thread-button')
      expect(bubbleButton).toBeTruthy()

      const threadId = await bubbleButton!.getAttribute('data-thread-id')
      expect(threadId).toBeTruthy()

      await bubbleButton!.click()

      const openedThread = page.locator(
        `.anchored-point-thread-contents[data-thread-id="${threadId!}"]`
      )
      await openedThread.waitFor()
    })
  })
})
