import { IBinding } from '~~/lib/bindings/definitions/IBinding'
import { BaseBridge } from '~~/lib/bridge/base'

export const ISelectionBindingKey = 'selectionBinding'

export interface ISelectionBinding extends IBinding<ISelectionBindingHostEvents> {
  getSelection: () => Promise<SelectionInfo>
}

export interface ISelectionBindingHostEvents {
  setSelection: (args: SelectionInfo) => void
}

export type SelectionInfo = {
  summary?: string
  selectedObjectIds: string[]
}

export class MockedSelectionBinding extends BaseBridge {
  private selectionInfo: SelectionInfo = {
    summary: 'test',
    selectedObjectIds: ['test_object_1']
  }

  constructor() {
    super()
  }

  getSelection() {
    return this.selectionInfo
  }

  setSelection(selection: string[]) {
    const selectionInfo = {
      summary: `${selection.length} object(s) selected.`,
      selectedObjectIds: selection
    }

    // trigger fake event
    this.emit('setSelection', JSON.stringify(selectionInfo))
  }
}
