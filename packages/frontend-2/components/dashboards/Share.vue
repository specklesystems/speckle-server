<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <Menu as="div" class="flex items-center relative">
    <MenuButton :id="menuButtonId" v-slot="{ open }" as="div">
      <FormButton
        color="outline"
        class="hidden sm:flex"
        size="sm"
        :icon-right="open ? ChevronUpIcon : ChevronDownIcon"
      >
        Share
      </FormButton>
    </MenuButton>
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <MenuItems
        class="absolute z-50 flex flex-col gap-1 right-0 top-11 min-w-max w-full sm:w-32 py-1 origin-top-right bg-foundation outline outline-1 outline-primary-muted rounded-md shadow-lg overflow-hidden mt-1"
      >
        <MenuItem v-slot="{ active }">
          <div
            :class="[
              active ? 'bg-highlight-1' : '',
              'text-body-xs flex px-2 py-1 text-foreground cursor-pointer transition mx-1 rounded'
            ]"
            @click="handleCopyLink"
            @keypress="keyboardClick(handleCopyLink)"
          >
            Copy link
          </div>
        </MenuItem>
      </MenuItems>
    </Transition>
  </Menu>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/20/solid'
import { keyboardClick } from '@speckle/ui-components'
import type { MaybeNullOrUndefined } from '@speckle/shared'

const props = defineProps<{
  id: MaybeNullOrUndefined<string>
}>()

const { copy } = useClipboard()
const menuButtonId = useId()

const handleCopyLink = () => {
  copy(props.id || '', { successMessage: 'Link copied to clipboard' })
}
</script>
