import SpeckleConverter from './SpeckleConverter.js'
import ObjectLoader from '@speckle/objectloader'
import { SpeckleLoader } from './SpeckleLoader.js'
import { WorldTree } from '../../tree/WorldTree.js'
import Logger from '../../utils/Logger.js'

export class SpeckleOfflineLoader extends SpeckleLoader {
  constructor(targetTree: WorldTree, resourceData: string, resourceId?: string) {
    super(targetTree, resourceId || '', undefined, undefined, resourceData)
    this.tree = targetTree
    this.loader = ObjectLoader.createFromJSON(this._resourceData as string)
    this.converter = new SpeckleConverter(this.loader, this.tree)
  }

  public async load(): Promise<boolean> {
    const rootObject = await this.loader.getRootObject()
    if (!rootObject && this._resource) {
      Logger.error('No root id set!')
      return false
    }
    this._resource = this._resource || `/json/${rootObject.id as string}`
    return super.load()
  }
}
