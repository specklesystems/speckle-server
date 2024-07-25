import type {
  IBinding,
  IBindingSharedEvents
} from '~/lib/bindings/definitions/IBinding'

export const ITopLevelExpectionHandlerBindingKey = 'topLevelExceptionHandlerBinding'

export interface ITopLevelExpectionHandlerBinding
  extends IBinding<ITopLevelExpectionHandlerBindingEvents> {}

export interface ITopLevelExpectionHandlerBindingEvents extends IBindingSharedEvents {}
