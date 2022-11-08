<template>
  <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
  <div
    class="group bg-base hover:bg-primary rounded-xl shadow hover:shadow-xl hover:scale-[1.02] transition-all hover:cursor-pointer"
  >
    <NuxtLink to="/project/bla/model/bla">
      <div class="mb-2 h-52 flex items-center justify-center">
        <img :src="model.previewUrl" alt="model preview" />
      </div>
    </NuxtLink>
    <div class="flex items-center justify-between gap-4 pl-3 pr-0">
      <div
        class="font-bold text-foreground group-hover:text-white truncate transition-colors"
      >
        {{ model.name }}
      </div>
      <div class="flex">
        <Disclosure v-slot="{ open }" as="div" class="relative">
          <div>
            <DisclosureButton
              class="text-foreground-2 group-hover:text-white flex items-center rounded-xl transition-colors hover:bg-primary-lighter p-2 text-center"
            >
              <div class="caption">{{ model.numVersions }}</div>
              <ClockIcon class="w-3 h-3 ml-1" />
              <EllipsisVerticalIcon v-if="!open" class="w-4 h-4" />
              <XMarkIcon v-else class="w-4 h-4" />
            </DisclosureButton>
            <Transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div v-show="open && hover">
                <DisclosurePanel
                  static
                  class="absolute caption left-0 z-10 ml-0 -mt-1 w-36 origin-top-right"
                >
                  <div
                    class="shadow-xl bg-base text-foreground dark:shadow-slate-600/25 outline-0 dark:outline overflow-clip rounded-md divide-y dark:divide-neutral-800"
                  >
                    <DisclosureButton v-slot="{ active }" as="template">
                      <a
                        :class="[
                          'block py-2 px-2 cursor-pointer hover:bg-base-2',
                          active ? 'bg-base-2' : ''
                        ]"
                      >
                        Share
                      </a>
                    </DisclosureButton>
                    <DisclosureButton v-slot="{ active }" as="template">
                      <a
                        :class="[
                          'block py-2 px-2 cursor-pointer hover:bg-base-2',
                          active ? 'bg-base-2' : ''
                        ]"
                      >
                        View Versions
                      </a>
                    </DisclosureButton>
                    <DisclosureButton v-slot="{ active }" as="template">
                      <a
                        :class="[
                          'block py-2 px-2 cursor-pointer hover:bg-base-2',
                          active ? 'bg-base-2' : ''
                        ]"
                      >
                        Open Project
                      </a>
                    </DisclosureButton>
                    <DisclosureButton v-slot="{ active }" as="template">
                      <a
                        :class="[
                          'block py-2 px-2 cursor-pointer hover:bg-base-2',
                          active ? 'bg-base-2' : ''
                        ]"
                      >
                        Delete
                      </a>
                    </DisclosureButton>
                  </div>
                </DisclosurePanel>
              </div>
            </Transition>
          </div>
        </Disclosure>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { PropType } from 'vue'
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Disclosure,
  DisclosureButton,
  DisclosurePanel
} from '@headlessui/vue'
import { ClockIcon } from '@heroicons/vue/24/outline'
import { EllipsisVerticalIcon, XMarkIcon } from '@heroicons/vue/24/solid'

type Model = {
  name: string
  previewUrl: string
  preview360Url: string
  numVersions: number
}

defineProps({
  model: {
    type: Object as PropType<Model>,
    required: true
  }
})
</script>
