<template>
  <slot />
</template>
<script setup lang="ts">
import type { Nullable, Optional } from '@speckle/shared'
import { getCurrentInstance, inject } from 'vue'
import type { ComponentInternalInstance, Ref } from 'vue'

/**
 * Sort of hacky - we need to manipulate the @headlessui combobox state, but it can't be injected
 * from its parent component (Tags.vue). This being initialized inside of a slot of the combobox,
 * it has access to the context
 *
 * Also the context is inaccessible due to it being tied to a private symbol, so we need
 * to retrieve that a bit hackily too.
 */

// Copied from headlessui
enum Focus {
  /** Focus the first non-disabled item. */
  First,

  /** Focus the previous non-disabled item. */
  Previous,

  /** Focus the next non-disabled item. */
  Next,

  /** Focus the last non-disabled item. */
  Last,

  /** Focus a specific item based on the `id` of the item. */
  Specific,

  /** Focus no items at all. */
  Nothing
}

enum ComboboxStates {
  Open,
  Closed
}

const instance = getCurrentInstance() as ComponentInternalInstance & {
  provides: Record<symbol | string, unknown>
}
const provides = instance['provides']
const ctxKey = Object.getOwnPropertySymbols(provides).find(
  (s) => s.description === 'ComboboxContext'
)
if (!ctxKey) {
  console.error('FormTagsContextManager ctx key not found!')
}

const state = inject(ctxKey || '__undefined') as Optional<{
  goToOption: (focus: Focus) => void
  openCombobox: () => void
  closeCombobox: () => void
  activeOptionIndex: Ref<Nullable<number>>
  selectActiveOption: () => void
  comboboxState: Ref<ComboboxStates>
}>

if (!state) {
  console.error('FormTagsContextManager ctx not found!')
}

const goUp = () => {
  state?.goToOption(Focus.Previous)
}
const goDown = () => {
  state?.goToOption(Focus.Next)
}
const open = () => {
  if (!state) return
  state.openCombobox()
}
const close = () => {
  state?.closeCombobox()
}
const selectActive = () => {
  state?.selectActiveOption()
}
const isOpen = () => state?.comboboxState.value === ComboboxStates.Open

defineExpose({ goUp, goDown, open, close, selectActive, isOpen })
</script>
