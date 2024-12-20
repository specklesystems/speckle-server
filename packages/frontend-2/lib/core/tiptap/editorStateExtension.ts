import type { Nullable } from '@speckle/shared'
import { Extension } from '@tiptap/core'

type EditorInstanceState = {
  projectId: Nullable<string>
  test: string
}

const initState = (): EditorInstanceState => ({
  projectId: null,
  test: ''
})

export type EditorInstanceStateStorage = {
  state: EditorInstanceState
}

export const EditorInstanceStateStorage = Extension.create<
  EditorInstanceState,
  EditorInstanceStateStorage
>({
  name: 'editorInstanceState',

  addStorage() {
    return {
      state: initState()
    }
  },

  addOptions() {
    return initState()
  },

  onCreate() {
    // Populate storage from options
    this.storage.state = this.options
  }
})
