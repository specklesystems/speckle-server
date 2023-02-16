<template>
  <Menu as="div" class="relative z-30">
    <MenuButton v-slot="{ open }" as="template">
      <ViewerControlsButtonToggle flat secondary :active="open">
        <VideoCameraIcon class="w-5 h-5" />
      </ViewerControlsButtonToggle>
    </MenuButton>
    <MenuItems
      class="absolute translate-x-0 w-28 left-12 top-2 bg-foundation outline outline-2 outline-primary-muted rounded-md shadow-lg overflow-hidden flex flex-col"
    >
      <MenuItem
        v-for="link in links"
        :key="link.href"
        v-slot="{ active }"
        as="template"
      >
        <a
          :href="link.href"
          :class="{
            'bg-primary text-foreground-on-primary': active,
            'text-foreground': !active,
            'text-sm py-2': true
          }"
        >
          {{ link.label }}
        </a>
      </MenuItem>
    </MenuItems>
  </Menu>
</template>
<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { VideoCameraIcon } from '@heroicons/vue/24/outline'

const links = [
  { href: '#', label: 'Top' },
  { href: '#', label: 'Front' },
  { href: '#', label: 'Left' },
  { href: '#', label: 'Back' },
  { href: '#', label: 'Right' }
]
</script>
