import { SpeckleLoader } from './SpeckleLoader.js'
import { WorldTree } from '../../tree/WorldTree.js'
import Logger from '../../utils/Logger.js'
import {
  ObjectLoader2,
  ObjectLoader2Factory,
  PropertyInfo
} from '@speckle/objectloader2'

export class SpeckleOfflineLoader extends SpeckleLoader {
  constructor(targetTree: WorldTree, resourceData: unknown, resourceId?: string) {
    super(targetTree, resourceId || '', undefined, undefined, resourceData)
  }

  protected initObjectLoader(
    _resource: string,
    _authToken?: string,
    _enableCaching?: boolean,
    resourceData?: unknown
  ): ObjectLoader2 {
    _resource
    _authToken
    _enableCaching
    resourceData
    /** TO DO: Implement either as part of ObjectLoader2 either separate */
    return ObjectLoader2Factory.createFromObjects([])
  }

  public get properties(): PropertyInfo[] {
    return []
  }

  public async load(): Promise<boolean> {
    const rootObject = await this.loader.getRootObject()
    if (!rootObject && this._resource) {
      Logger.error('No root id set!')
      return false
    }
    /** If not id is provided, we make one up based on the root object id */
    this._resource =
      this._resource || `/json/${(rootObject?.baseId as string) ?? 'unnamed'}`
    return await super.load()
  }
}
