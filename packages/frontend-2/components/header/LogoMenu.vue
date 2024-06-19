<template>
  <LayoutMenu v-slot="{ toggle, open }" :items="menuItems">
    <button class="flex gap-1 items-center" @click="toggle">
      <HeaderLogoBlock no-link />
      <ChevronDownIcon
        :class="{ 'rotate-180': open }"
        class="h-3 w-3 transition-transform duration-200"
      />
    </button>
  </LayoutMenu>
</template>

<script setup lang="ts">
import {
  HomeIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline'
import { LayoutMenu, type LayoutMenuItem } from '@speckle/ui-components'
import { computed } from 'vue'

const menuItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: 'Go to Dashboard',
      id: 'goToDashboard',
      icon: HomeIcon
    }
  ],
  [
    {
      title: 'Settings',
      id: 'settings',
      icon: Cog6ToothIcon
    },
    {
      title: 'Download Connectors',
      id: 'downloadConnectors',
      icon: ArrowDownTrayIcon
    },
    {
      title: 'Toggle Dark Mode',
      id: 'toggleDarkMode',
      icon: MoonIcon
    }
  ],
  [
    {
      title: 'Log Out',
      id: 'logOut',
      icon: ArrowRightOnRectangleIcon
    }
  ]
])
</script>
