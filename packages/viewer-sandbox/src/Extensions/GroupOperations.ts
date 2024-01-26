import { WorldTree } from '@speckle/viewer'
import { Extension, TreeNode } from '@speckle/viewer'

export class GroupOperations extends Extension {
  public idGroups = {
    16000: []
  }

  public async getIds() {
    await this.viewer.getWorldTree().walkAsync((node: TreeNode) => {
      if (
        this.viewer.getWorldTree().isRoot(node) ||
        node.parent.model.id === WorldTree.ROOT_ID
      )
        return true
      const dice = Math.random()
      if (dice < 0.1 && this.idGroups['16000'].length < 16000)
        this.idGroups['16000'].push(node.model.id)
      return true
    })
    console.log(this.idGroups)
  }
}
