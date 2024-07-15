import { BaseError } from '@/modules/shared/errors/base'

export class GendoRenderRequestError extends BaseError {
  static code = 'GENDO_RENDER_REQUEST_ERROR'
  static defaultMessage = 'Error requesting Gendo render'
}
