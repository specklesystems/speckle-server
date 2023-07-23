/* eslint-disable @typescript-eslint/require-await */

import { SpeckleObject } from '@speckle/objectloader'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'

/**
 * The name under which this binding will be registered.
 */
export const ISketchupReceiveBindingKey = 'sketchupReceiveBinding'

/**
 * Sketchup receive binding interface to receive objects on Sketchup.
 */
export interface ISketchupReceiveBinding
  extends IBinding<ISketchupReceiveBindingEvents> {
  beforeReceive: (streamId: string, rootId: string) => Promise<void>
  receiveObject: (
    streamId: string,
    rootId: string,
    object: SpeckleObject
  ) => Promise<void>
  afterReceive: (streamId: string, rootId: string) => Promise<void>
}

export interface ISketchupReceiveBindingEvents {
  dummyReceiveEvent: () => void
}
