import { type SpecklePass } from '@speckle/viewer'
import { Extension } from '@speckle/viewer'
import { Vector3, Vector4 } from 'three'

export class PassReader extends Extension {
  private outputBuffer: Uint8Array = []
  private needsRead: boolean = false
  private readbackExecutor: (arg: string) => void

  public async read(): Promise<string> {
    return new Promise<string>((resolve) => {
      const dephPass: SpecklePass =
        this.viewer.getRenderer().pipeline.composer.passes[0]

      const bufferSize =
        dephPass.outputRenderTarget.width * dephPass.outputRenderTarget.height * 4
      if (this.outputBuffer.length !== bufferSize)
        this.outputBuffer = new Uint8Array(bufferSize)
      this.needsRead = true
      this.readbackExecutor = resolve
    })
  }

  public onRender(): void {
    if (!this.needsRead) return

    const dephPass: SpecklePass = this.viewer.getRenderer().pipeline.composer.passes[0]
    const depthPassRT = dephPass.outputRenderTarget
    this.viewer
      .getRenderer()
      .renderer.readRenderTargetPixels(
        depthPassRT,
        0,
        0,
        depthPassRT.width,
        depthPassRT.height,
        this.outputBuffer
      )
    const UnpackDownscale = 255 / 256
    const PackFactors = new Vector3(256 * 256 * 256, 256 * 256, 256)
    const UnpackFactors = new Vector4(
      UnpackDownscale / PackFactors.x,
      UnpackDownscale / PackFactors.y,
      UnpackDownscale / PackFactors.z,
      1
    )

    const v4 = new Vector4()
    for (let k = 0; k < this.outputBuffer.length; k += 4) {
      v4.set(
        this.outputBuffer[k] / 255,
        this.outputBuffer[k + 1] / 255,
        this.outputBuffer[k + 2] / 255,
        this.outputBuffer[k + 3] / 255
      )
      const res = v4.dot(UnpackFactors)
      this.outputBuffer[k] = res * 255
      this.outputBuffer[k + 1] = res * 255
      this.outputBuffer[k + 2] = res * 255
      this.outputBuffer[k + 3] = 255
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = depthPassRT.width
    canvas.height = depthPassRT.height

    // create imageData object
    const idata = ctx.createImageData(depthPassRT.width, depthPassRT.height)

    // set our buffer as source
    idata.data.set(this.outputBuffer)

    // update canvas with new data
    ctx.putImageData(idata, 0, 0)
    ctx.save()
    /** Flipping the image by drawing it on itself
     */
    ctx.globalCompositeOperation = 'copy'
    ctx.scale(1, -1)
    ctx.drawImage(canvas, 0, 0, depthPassRT.width, -depthPassRT.height)
    ctx.restore()

    this.readbackExecutor(canvas.toDataURL())
    this.needsRead = false
  }
}
