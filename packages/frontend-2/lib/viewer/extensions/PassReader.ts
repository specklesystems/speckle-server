import { Extension } from '@speckle/viewer'
import type { WebGLRenderTarget } from 'three'
import { Vector3, Vector4 } from 'three'

export class PassReader extends Extension {
  private outputBuffer: Uint8Array = new Uint8Array()
  private renderTarget: WebGLRenderTarget | undefined = undefined
  private needsRead: boolean = false
  private readbackExecutor: ((arg: string) => void) | null = null

  public async read(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // const renderer: SpeckleRenderer = this.viewer.getRenderer()

      // const dephPass: SpecklePass = renderer.pipeline.composer
      //   .passes[0] as unknown as SpecklePass
      // // o_0

      // this.renderTarget = dephPass.outputRenderTarget
      // if (!this.renderTarget) {
      reject('Issue with depth pass render target')
      //   return
      // }

      // const bufferSize = this.renderTarget.width * this.renderTarget.height * 4
      // if (this.outputBuffer.length !== bufferSize)
      //   this.outputBuffer = new Uint8Array(bufferSize)
      // this.needsRead = true
      // this.readbackExecutor = resolve
    })
  }

  public onRender(): void {
    if (!this.needsRead || this.renderTarget === undefined) return

    this.viewer
      .getRenderer()
      .renderer.readRenderTargetPixels(
        this.renderTarget,
        0,
        0,
        this.renderTarget.width,
        this.renderTarget.height,
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
    canvas.width = this.renderTarget.width
    canvas.height = this.renderTarget.height

    // create imageData object
    const idata = ctx.createImageData(this.renderTarget.width, this.renderTarget.height)

    // set our buffer as source
    idata.data.set(this.outputBuffer)

    // update canvas with new data
    ctx.putImageData(idata, 0, 0)
    ctx.save()
    /** Flipping the image by drawing it on itself
     */
    ctx.globalCompositeOperation = 'copy'
    ctx.scale(1, -1)
    ctx.drawImage(canvas, 0, 0, this.renderTarget.width, -this.renderTarget.height)
    ctx.restore()

    if (this.readbackExecutor) this.readbackExecutor(canvas.toDataURL())
    this.needsRead = false
  }
}
