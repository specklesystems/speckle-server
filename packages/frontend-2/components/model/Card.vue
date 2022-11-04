<template>
  <div
    class="group rounded-xl shadow hover:shadow-xl transition background hover:background-highlight-2 dark:shadow-slate-500/10 text-neutral-500 dark:text-neutral-500 hover:cursor-pointer"
  >
    <NuxtLink to="/project/bla/model/bla">
      <div class="mb-2 h-52 flex items-center justify-center">
        <img :src="model.previewUrl" alt="model preview" />
      </div>
    </NuxtLink>
    <div class="flex items-center justify-between gap-4 pl-3 pr-0">
      <div class="font-bold text-sm truncate transition-colors">
        {{ model.name }}
      </div>
      <div class="flex">
        <div
          class="flex items-center rounded-xl px-2 -mr-4 hover:bg-blue-50 dark:hover:bg-slate-900 hover:text-blue-500 transition-colors"
        >
          <div class="caption">{{ model.numVersions }}</div>
          <ClockIcon class="w-3 h-3 ml-1" />
        </div>
        <Menu as="div" class="relative">
          <div>
            <MenuButton
              v-slot="{ open }"
              class="rounded-full transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 p-2 text-center"
            >
              <EllipsisVerticalIcon v-if="!open" class="w-4 h-4" />
              <XMarkIcon v-else class="w-4 h-4" />
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
                class="absolute caption left-0 z-10 ml-4 -mt-2 w-36 origin-top-right"
              >
                <div
                  class="shadow-xl dark:shadow-slate-600/25 outline-0 dark:outline overflow-clip rounded-md divide-y dark:divide-neutral-800 background"
                >
                  <MenuItem v-slot="{ active }">
                    <a
                      :class="[
                        'block py-2 px-2 cursor-pointer',
                        active ? 'background' : ''
                      ]"
                    >
                      Share
                    </a>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <a
                      :class="[
                        'block py-2 px-2 cursor-pointer',
                        active ? 'background' : ''
                      ]"
                    >
                      Open Project
                    </a>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <a
                      :class="[
                        'block py-2 px-2 cursor-pointer',
                        active ? 'background' : ''
                      ]"
                    >
                      Delete
                    </a>
                  </MenuItem>
                </div>
              </MenuItems>
            </Transition>
          </div>
        </Menu>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { PropType } from 'vue'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { ClockIcon } from '@heroicons/vue/24/outline'
import { EllipsisVerticalIcon, XMarkIcon } from '@heroicons/vue/24/solid'

type Model = {
  name: string
  previewUrl: string
  numVersions: number
}

defineProps({
  model: {
    type: Object as PropType<Model>,
    required: true
  }
})
</script>
