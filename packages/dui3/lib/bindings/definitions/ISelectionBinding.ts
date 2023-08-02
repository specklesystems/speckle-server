import { IBinding } from '~~/lib/bindings/definitions/IBinding'

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
