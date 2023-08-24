<template>
  <Menu v-slot="{ open: isMenuOpen }" as="div" class="relative inline-block">
    <div>
      <MenuButton ref="menuButton" class="hidden" @click.stop.prevent />
      <!-- conditional pointer-events-none is necessary to avoid double events when clicking on the button when the menu is already open -->
      <div :class="isMenuOpen ? 'pointer-events-none' : ''">
        <slot :toggle="toggle" :open="processOpen(isMenuOpen)" />
      </div>
    </div>
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <MenuItems
        ref="menuItems"
        :class="[
          'absolute mt-2 w-56 origin-top-right divide-y divide-outline-3 rounded-md bg-foundation shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-40',
          menuDirection === HorizontalDirection.Left ? 'right-0' : ''
        ]"
      >
        <div v-for="(group, i) in items" :key="i" class="px-1 py-1">
          <MenuItem
            v-for="item in group"
            v-slot="{ active, disabled }"
            :key="item.id"
            :disabled="item.disabled"
          >
            <span v-tippy="item.disabled && item.disabledTooltip">
              <button
                :class="buildButtonClassses({ active, disabled })"
                :disabled="disabled"
                @click="chooseItem(item, $event)"
              >
                <slot name="item" :item="item">{{ item.title }}</slot>
              </button>
            </span>
          </MenuItem>
        </div>
      </MenuItems>
    </Transition>
  </Menu>
</template>
<script setup lang="ts">
import { directive as vTippy } from 'vue-tippy'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { Nullable } from '@speckle/shared'
import { computed, ref, watch } from 'vue'
import {
  HorizontalDirection,
  useResponsiveHorizontalDirectionCalculation
} from '~~/src/composables/common/window'
import { LayoutMenuItem } from '~~/src/helpers/layout/components'

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (e: 'chosen', val: { event: MouseEvent; item: LayoutMenuItem<any> }): void
}>()

const props = defineProps<{
  open?: boolean
  /**
   * 2D array so that items can be grouped with dividers between them
   */
  items: LayoutMenuItem[][]
}>()

const menuItems = ref(null as Nullable<{ el: HTMLDivElement }>)
const { direction: menuDirection } = useResponsiveHorizontalDirectionCalculation({
  el: computed(() => menuItems.value?.el || null),
  defaultDirection: HorizontalDirection.Left,
  stopUpdatesBelowWidth: 300
})

const menuButton = ref(null as Nullable<{ el: HTMLButtonElement }>)
const isOpenInternally = ref(false)

const finalOpen = computed({
  get: () => props.open || false,
  set: (newVal) => emit('update:open', newVal)
})

const buildButtonClassses = (params: { active?: boolean; disabled?: boolean }) => {
  const { active, disabled } = params
  const classParts = ['group flex w-full items-center rounded-md px-2 py-2 text-sm']

  if (active) {
    classParts.push('bg-primary text-foreground-on-primary')
  } else if (disabled) {
    classParts.push('text-foreground-disabled')
  } else {
    classParts.push('text-foreground')
  }

  return classParts.join(' ')
}

const chooseItem = (item: LayoutMenuItem, event: MouseEvent) => {
  emit('chosen', { item, event })
}

const toggle = () => menuButton.value?.el.click()

// ok this is a bit hacky, but it's done because of headlessui's limited API
// the point of this is 1) cast any to bool 2) store 'open' state locally
// so that we can access it outside of the template
const processOpen = (val: unknown): val is boolean => {
  const isOpen = !!val
  isOpenInternally.value = isOpen
  return isOpen
}

watch(isOpenInternally, (newVal, oldVal) => {
  if (newVal === oldVal) return
  finalOpen.value = newVal
})

watch(finalOpen, (shouldBeOpen) => {
  if (shouldBeOpen && !isOpenInternally.value) {
    toggle()
  } else if (!shouldBeOpen && isOpenInternally.value) {
    toggle()
  }
})
</script>
