import { test } from 'vitest'
import { JSDOM } from 'jsdom'
import { Viewer } from '../src'

test('Viewer', async () => {
  const width = 64
  const height = 64
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gl = require('gl')(width, height, { preserveDrawingBuffer: true })
  gl
  const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`)
  const viewer = new Viewer(dom.window.document.createElement('div'), undefined, gl)
  console.warn(viewer)
})
