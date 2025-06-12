/* eslint-disable camelcase */
import {
  _SRGBAFormat,
  AlphaFormat,
  ByteType,
  Camera,
  DepthFormat,
  DepthStencilFormat,
  FloatType,
  HalfFloatType,
  IntType,
  LuminanceAlphaFormat,
  LuminanceFormat,
  Matrix4,
  RedFormat,
  RedIntegerFormat,
  RGB_ETC1_Format,
  RGB_ETC2_Format,
  RGB_PVRTC_2BPPV1_Format,
  RGB_PVRTC_4BPPV1_Format,
  RGB_S3TC_DXT1_Format,
  RGBA_ASTC_10x10_Format,
  RGBA_ASTC_10x5_Format,
  RGBA_ASTC_10x6_Format,
  RGBA_ASTC_10x8_Format,
  RGBA_ASTC_12x10_Format,
  RGBA_ASTC_12x12_Format,
  RGBA_ASTC_4x4_Format,
  RGBA_ASTC_5x4_Format,
  RGBA_ASTC_5x5_Format,
  RGBA_ASTC_6x5_Format,
  RGBA_ASTC_6x6_Format,
  RGBA_ASTC_8x5_Format,
  RGBA_ASTC_8x6_Format,
  RGBA_ASTC_8x8_Format,
  RGBA_BPTC_Format,
  RGBA_ETC2_EAC_Format,
  RGBA_PVRTC_2BPPV1_Format,
  RGBA_PVRTC_4BPPV1_Format,
  RGBA_S3TC_DXT1_Format,
  RGBA_S3TC_DXT3_Format,
  RGBA_S3TC_DXT5_Format,
  RGBAFormat,
  RGBAIntegerFormat,
  RGBFormat,
  RGFormat,
  RGIntegerFormat,
  ShortType,
  sRGBEncoding,
  UnsignedByteType,
  UnsignedInt248Type,
  UnsignedIntType,
  UnsignedShort4444Type,
  UnsignedShort5551Type,
  UnsignedShortType,
  Vector3,
  WebGLCubeRenderTarget,
  WebGLMultipleRenderTargets,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'
import { Geometry } from '../converter/Geometry.js'
import { TypedArray } from 'type-fest'
export class RTEBuffers {
  private _cache: RTEBuffers | undefined

  viewer: Vector3 = new Vector3()
  viewerLow: Vector3 = new Vector3()
  viewerHigh: Vector3 = new Vector3()
  rteViewModelMatrix: Matrix4 = new Matrix4()

  shadowViewer: Vector3 = new Vector3()
  shadowViewerLow: Vector3 = new Vector3()
  shadowViewerHigh: Vector3 = new Vector3()
  rteShadowViewModelMatrix: Matrix4 = new Matrix4()
  rteShadowMatrix: Matrix4 = new Matrix4()

  copy(from: RTEBuffers, to: RTEBuffers) {
    to.viewer.copy(from.viewer)
    to.viewerLow.copy(from.viewerLow)
    to.viewerHigh.copy(from.viewerHigh)
    to.rteViewModelMatrix.copy(from.rteViewModelMatrix)

    to.shadowViewer.copy(from.shadowViewer)
    to.shadowViewerLow.copy(from.shadowViewerLow)
    to.shadowViewerHigh.copy(from.shadowViewerHigh)
    to.rteShadowViewModelMatrix.copy(from.rteShadowViewModelMatrix)
    to.rteShadowMatrix.copy(from.rteShadowMatrix)
  }

  push() {
    if (!this._cache) this._cache = new RTEBuffers()
    this.copy(this, this._cache)
  }

  pop() {
    if (!this._cache) this._cache = new RTEBuffers()
    this.copy(this._cache, this)
  }
}

export class SpeckleWebGLRenderer extends WebGLRenderer {
  public RTEBuffers = new RTEBuffers()

  updateRTEViewModel(camera: Camera) {
    this.RTEBuffers.rteViewModelMatrix.copy(camera.matrixWorldInverse)
    this.RTEBuffers.rteViewModelMatrix.elements[12] = 0
    this.RTEBuffers.rteViewModelMatrix.elements[13] = 0
    this.RTEBuffers.rteViewModelMatrix.elements[14] = 0

    this.RTEBuffers.viewer.set(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLowVector(
      this.RTEBuffers.viewer,
      this.RTEBuffers.viewerLow,
      this.RTEBuffers.viewerHigh
    )
  }

  public readRenderTargetPixels = (
    renderTarget:
      | WebGLRenderTarget
      | WebGLCubeRenderTarget
      | WebGLMultipleRenderTargets,
    x: number,
    y: number,
    width: number,
    height: number,
    buffer: TypedArray,
    activeCubeFaceIndex: number = 0
  ) => {
    if (
      !(
        renderTarget &&
        (renderTarget instanceof WebGLRenderTarget ||
          renderTarget instanceof WebGLMultipleRenderTargets)
      )
    ) {
      console.error(
        'THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.'
      )
      return
    }

    let framebuffer = this.properties.get(renderTarget).__webglFramebuffer

    if (
      renderTarget instanceof WebGLCubeRenderTarget &&
      activeCubeFaceIndex !== undefined
    ) {
      framebuffer = framebuffer[activeCubeFaceIndex]
    }

    if (framebuffer) {
      this.state.bindFramebuffer(36160, framebuffer)

      try {
        const texture = Array.isArray(renderTarget.texture)
          ? renderTarget.texture[0]
          : renderTarget.texture
        const textureFormat = texture.format
        const textureType = texture.type

        if (
          textureFormat !== RGBAFormat &&
          this.convert(textureFormat) !== this.context.getParameter(35739)
        ) {
          console.error(
            'THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.'
          )
          return
        }

        const halfFloatSupportedByExt =
          textureType === HalfFloatType &&
          (this.extensions.has('EXT_color_buffer_half_float') ||
            (this.capabilities.isWebGL2 &&
              this.extensions.has('EXT_color_buffer_float')))

        if (
          textureType !== UnsignedByteType &&
          this.convert(textureType) !== this.context.getParameter(35738) && // Edge and Chrome Mac < 52 (#9513)
          !(
            textureType === FloatType &&
            (this.capabilities.isWebGL2 ||
              this.extensions.has('OES_texture_float') ||
              this.extensions.has('WEBGL_color_buffer_float'))
          ) && // Chrome Mac >= 52 and Firefox
          !halfFloatSupportedByExt
        ) {
          console.error(
            'THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.'
          )
          return
        }

        // the following if statement ensures valid read requests (no out-of-bounds pixels, see #8604)

        if (
          x >= 0 &&
          x <= renderTarget.width - width &&
          y >= 0 &&
          y <= renderTarget.height - height
        ) {
          this.context.readPixels(
            x,
            y,
            width,
            height,
            this.convert(textureFormat),
            this.convert(textureType),
            buffer
          )
        }
      } finally {
        // restore framebuffer of current render target if necessary

        const framebuffer =
          this.getRenderTarget() !== null
            ? this.properties.get(this.getRenderTarget()).__webglFramebuffer
            : null
        this.state.bindFramebuffer(36160, framebuffer)
      }
    }
  }

  /** Taken from three since they hide it, thank you very much */
  private convert(p: number, encoding = null) {
    let extension

    if (p === UnsignedByteType) return 5121
    if (p === UnsignedShort4444Type) return 32819
    if (p === UnsignedShort5551Type) return 32820

    if (p === ByteType) return 5120
    if (p === ShortType) return 5122
    if (p === UnsignedShortType) return 5123
    if (p === IntType) return 5124
    if (p === UnsignedIntType) return 5125
    if (p === FloatType) return 5126

    if (p === HalfFloatType) {
      if (this.capabilities.isWebGL2) return 5131

      extension = this.extensions.get('OES_texture_half_float')

      if (extension !== null) {
        return extension.HALF_FLOAT_OES
      } else {
        return null
      }
    }

    if (p === AlphaFormat) return 6406
    if (p === RGBAFormat) return 6408
    if (p === LuminanceFormat) return 6409
    if (p === LuminanceAlphaFormat) return 6410
    if (p === DepthFormat) return 6402
    if (p === DepthStencilFormat) return 34041
    if (p === RedFormat) return 6403

    if (p === RGBFormat) {
      console.warn(
        'THREE.WebGLRenderer: THREE.RGBFormat has been removed. Use THREE.RGBAFormat instead. https://github.com/mrdoob/three.js/pull/23228'
      )
      return 6408
    }

    // WebGL 1 sRGB fallback

    if (p === _SRGBAFormat) {
      extension = this.extensions.get('EXT_sRGB')

      if (extension !== null) {
        return extension.SRGB_ALPHA_EXT
      } else {
        return null
      }
    }

    // WebGL2 formats.

    if (p === RedIntegerFormat) return 36244
    if (p === RGFormat) return 33319
    if (p === RGIntegerFormat) return 33320
    if (p === RGBAIntegerFormat) return 36249

    // S3TC

    if (
      p === RGB_S3TC_DXT1_Format ||
      p === RGBA_S3TC_DXT1_Format ||
      p === RGBA_S3TC_DXT3_Format ||
      p === RGBA_S3TC_DXT5_Format
    ) {
      if (encoding === sRGBEncoding) {
        extension = this.extensions.get('WEBGL_compressed_texture_s3tc_srgb')

        if (extension !== null) {
          if (p === RGB_S3TC_DXT1_Format) return extension.COMPRESSED_SRGB_S3TC_DXT1_EXT
          if (p === RGBA_S3TC_DXT1_Format)
            return extension.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT
          if (p === RGBA_S3TC_DXT3_Format)
            return extension.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT
          if (p === RGBA_S3TC_DXT5_Format)
            return extension.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT
        } else {
          return null
        }
      } else {
        extension = this.extensions.get('WEBGL_compressed_texture_s3tc')

        if (extension !== null) {
          if (p === RGB_S3TC_DXT1_Format) return extension.COMPRESSED_RGB_S3TC_DXT1_EXT
          if (p === RGBA_S3TC_DXT1_Format)
            return extension.COMPRESSED_RGBA_S3TC_DXT1_EXT
          if (p === RGBA_S3TC_DXT3_Format)
            return extension.COMPRESSED_RGBA_S3TC_DXT3_EXT
          if (p === RGBA_S3TC_DXT5_Format)
            return extension.COMPRESSED_RGBA_S3TC_DXT5_EXT
        } else {
          return null
        }
      }
    }

    // PVRTC

    if (
      p === RGB_PVRTC_4BPPV1_Format ||
      p === RGB_PVRTC_2BPPV1_Format ||
      p === RGBA_PVRTC_4BPPV1_Format ||
      p === RGBA_PVRTC_2BPPV1_Format
    ) {
      extension = this.extensions.get('WEBGL_compressed_texture_pvrtc')

      if (extension !== null) {
        if (p === RGB_PVRTC_4BPPV1_Format)
          return extension.COMPRESSED_RGB_PVRTC_4BPPV1_IMG
        if (p === RGB_PVRTC_2BPPV1_Format)
          return extension.COMPRESSED_RGB_PVRTC_2BPPV1_IMG
        if (p === RGBA_PVRTC_4BPPV1_Format)
          return extension.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG
        if (p === RGBA_PVRTC_2BPPV1_Format)
          return extension.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG
      } else {
        return null
      }
    }

    // ETC1

    if (p === RGB_ETC1_Format) {
      extension = this.extensions.get('WEBGL_compressed_texture_etc1')

      if (extension !== null) {
        return extension.COMPRESSED_RGB_ETC1_WEBGL
      } else {
        return null
      }
    }

    // ETC2

    if (p === RGB_ETC2_Format || p === RGBA_ETC2_EAC_Format) {
      extension = this.extensions.get('WEBGL_compressed_texture_etc')

      if (extension !== null) {
        if (p === RGB_ETC2_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB8_ETC2
            : extension.COMPRESSED_RGB8_ETC2
        if (p === RGBA_ETC2_EAC_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC
            : extension.COMPRESSED_RGBA8_ETC2_EAC
      } else {
        return null
      }
    }

    // ASTC

    if (
      p === RGBA_ASTC_4x4_Format ||
      p === RGBA_ASTC_5x4_Format ||
      p === RGBA_ASTC_5x5_Format ||
      p === RGBA_ASTC_6x5_Format ||
      p === RGBA_ASTC_6x6_Format ||
      p === RGBA_ASTC_8x5_Format ||
      p === RGBA_ASTC_8x6_Format ||
      p === RGBA_ASTC_8x8_Format ||
      p === RGBA_ASTC_10x5_Format ||
      p === RGBA_ASTC_10x6_Format ||
      p === RGBA_ASTC_10x8_Format ||
      p === RGBA_ASTC_10x10_Format ||
      p === RGBA_ASTC_12x10_Format ||
      p === RGBA_ASTC_12x12_Format
    ) {
      extension = this.extensions.get('WEBGL_compressed_texture_astc')

      if (extension !== null) {
        if (p === RGBA_ASTC_4x4_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR
            : extension.COMPRESSED_RGBA_ASTC_4x4_KHR
        if (p === RGBA_ASTC_5x4_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR
            : extension.COMPRESSED_RGBA_ASTC_5x4_KHR
        if (p === RGBA_ASTC_5x5_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR
            : extension.COMPRESSED_RGBA_ASTC_5x5_KHR
        if (p === RGBA_ASTC_6x5_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR
            : extension.COMPRESSED_RGBA_ASTC_6x5_KHR
        if (p === RGBA_ASTC_6x6_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR
            : extension.COMPRESSED_RGBA_ASTC_6x6_KHR
        if (p === RGBA_ASTC_8x5_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR
            : extension.COMPRESSED_RGBA_ASTC_8x5_KHR
        if (p === RGBA_ASTC_8x6_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR
            : extension.COMPRESSED_RGBA_ASTC_8x6_KHR
        if (p === RGBA_ASTC_8x8_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR
            : extension.COMPRESSED_RGBA_ASTC_8x8_KHR
        if (p === RGBA_ASTC_10x5_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR
            : extension.COMPRESSED_RGBA_ASTC_10x5_KHR
        if (p === RGBA_ASTC_10x6_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR
            : extension.COMPRESSED_RGBA_ASTC_10x6_KHR
        if (p === RGBA_ASTC_10x8_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR
            : extension.COMPRESSED_RGBA_ASTC_10x8_KHR
        if (p === RGBA_ASTC_10x10_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR
            : extension.COMPRESSED_RGBA_ASTC_10x10_KHR
        if (p === RGBA_ASTC_12x10_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR
            : extension.COMPRESSED_RGBA_ASTC_12x10_KHR
        if (p === RGBA_ASTC_12x12_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR
            : extension.COMPRESSED_RGBA_ASTC_12x12_KHR
      } else {
        return null
      }
    }

    // BPTC

    if (p === RGBA_BPTC_Format) {
      extension = this.extensions.get('EXT_texture_compression_bptc')

      if (extension !== null) {
        if (p === RGBA_BPTC_Format)
          return encoding === sRGBEncoding
            ? extension.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT
            : extension.COMPRESSED_RGBA_BPTC_UNORM_EXT
      } else {
        return null
      }
    }

    //

    if (p === UnsignedInt248Type) {
      if (this.capabilities.isWebGL2) return 34042

      extension = this.extensions.get('WEBGL_depth_texture')

      if (extension !== null) {
        return extension.UNSIGNED_INT_24_8_WEBGL
      } else {
        return null
      }
    }

    // if "p" can't be resolved, assume the user defines a WebGL constant as a string (fallback/workaround for packed RGB formats)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    return this.context[p] !== undefined ? this.context[p] : null
  }
}
