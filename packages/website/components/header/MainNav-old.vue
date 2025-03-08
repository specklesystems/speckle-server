<template>
  <div v-if="navMenu" class="flex">
    <!-- <div>{{ navMenu.items.length }}</div> -->
    <template v-for="(item, idx) in navMenu.items">
      <template v-if="item._type == 'navMenuItem'">
        <CommonNavButton :to="item.url.current" :key="idx">
          {{ item.label }}
        </CommonNavButton>
      </template>
      <template v-else>
        <Popover v-slot="{ open }" class="relative">
          <PopoverButton :as="CommonNavButton">
            <span>{{ item.label }}</span>
            <ChevronDownIcon
              :class="open ? 'rotate-180' : ''"
              class="ml-[2px] h-5 w-5 transition duration-150 ease-in-out group-hover:text-orange-300/80"
              aria-hidden="true"
            />
          </PopoverButton>
          <transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="translate-y-1 opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="translate-y-0 opacity-100"
            leave-to-class="translate-y-1 opacity-0"
          >
            <PopoverPanel
              v-if="open"
              static
              class="absolute inset-x-0 top-0 -z-10 bg-white pt-16 shadow-lg ring-1 ring-gray-900/5"
            >
              >
              <h2>Test</h2>
            </PopoverPanel>
          </transition>
        </Popover>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import CommonNavButton from '~~/components/common/NavButton.vue'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import {
  ChevronDownIcon,
  PhoneIcon,
  PlayCircleIcon,
  RectangleGroupIcon
} from '@heroicons/vue/20/solid'
import {
  ChartPieIcon,
  CursorArrowRaysIcon,
  FingerPrintIcon,
  SquaresPlusIcon
} from '@heroicons/vue/24/outline'

const query = groq`
  *[_type == "navMenu"][0] {
    items
  }
`
const { data: navMenu } = useSanityQuery(query)
</script>
