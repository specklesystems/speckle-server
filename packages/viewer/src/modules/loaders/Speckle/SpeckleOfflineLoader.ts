import ObjectLoader from '@speckle/objectloader'
import { SpeckleLoader } from './SpeckleLoader.js'
import { WorldTree } from '../../tree/WorldTree.js'
import Logger from '../../utils/Logger.js'

export class SpeckleOfflineLoader extends SpeckleLoader {
  constructor(targetTree: WorldTree, resourceData: string, resourceId?: string) {
    super(targetTree, resourceId || '', undefined, undefined, resourceData)
  }

  protected initObjectLoader(
    _resource: string,
    _authToken?: string,
    _enableCaching?: boolean,
    resourceData?: string | ArrayBuffer
  ): ObjectLoader {
    return ObjectLoader.createFromJSON(resourceData as string)
  }

  public async load(): Promise<boolean> {
    const rootObject = await this.loader.getRootObject()
    if (!rootObject && this._resource) {
      Logger.error('No root id set!')
      return false
    }
    /** If not id is provided, we make one up based on the root object id */
    this._resource = this._resource || `/json/${rootObject.id as string}`
    return super.load()
  }
}
