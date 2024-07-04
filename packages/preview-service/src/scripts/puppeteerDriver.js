export const puppeteerDriver = async (objectUrl) => {
  const waitForAnimation = async (ms = 70) =>
    await new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  const ret = {
    duration: 0,
    mem: 0,
    scr: {}
  }

  const t0 = Date.now()

  await window.v.init()

  try {
    await window.v.loadObjectAsync(objectUrl)
  } catch {
    // Main call failed. Wait some time for other objects to load inside the viewer and generate the preview anyway
    await waitForAnimation(1000)
  }
  window.v.resize()
  window.v.zoom(undefined, 0.95, false)
  await waitForAnimation(100)

  for (let i = 0; i < 24; i++) {
    window.v.setView({ azimuth: Math.PI / 12, polar: 0 }, false)
    window.v.getRenderer().resetPipeline(true)
    /** Not sure what the frame time when running pupeteer is, but it's not 16ms.
     *  That's why we're allowing more time between frames than probably needed
     *  In a future update, we'll have the viewer signal when convergence is complete
     *  regradless of how many frames/time that takes
     */
    /** 22.11.2022 Alex: Commenting this out for now */
    // await waitForAnimation(2500)
    await waitForAnimation()
    ret.scr[i + ''] = await window.v.screenshot()
  }

  ret.duration = (Date.now() - t0) / 1000
  ret.mem = {
    total: performance.memory.totalJSHeapSize,
    used: performance.memory.usedJSHeapSize
  }
  ret.userAgent = navigator.userAgent
  return ret
}
