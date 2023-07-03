// Basic nuxt e2e test with vitest
import { createPage, setup } from '@nuxt/test-utils'
import { describe, it, expect } from 'vitest'
// import path from 'path'

describe('viewer', async () => {
  await setup({
    // test context options
    // dev: true
    // // rootDir: './aga/'
    // buildDir: path.resolve(__dirname, '../../.output'),
    // build: false,
    // nuxtConfig: {
    //   buildDir: path.resolve(__dirname, '../../.output'),
    //   nitro: {
    //     output: {
    //       dir: path.resolve(__dirname, '../../.output')
    //     }
    //   }
    // },
    // browser: true
  })

  it('renders the viewer', async () => {
    const page = await createPage('/projects/9387e7e4c2/models/51c7c5b8eb')
    await page.waitForSelector('#speckle')
    const content = await page.content()
    expect(content).toMatch('helloworld')

    // page.mouse.click()
    // expect(content).toMatch()

    // await page.goto(testConfig.url('/viewer'))
    // await page.waitForSelector('.viewer')
    // await expect(page).toMatch('This is a viewer page')
  }, 100000)
})
