<template>
  <div class="flex items-center">
    <div v-if="separator">
      <MinusIcon class="sm:hidden w-5 h-5" />
      <ChevronRightIcon class="hidden sm:flex w-5 h-5" />
    </div>
    <div>
      <NuxtLink
        :to="to"
        :class="`px-3 py-1 h6 font-bold hover:bg-blue-50 dark:hover:bg-slate-900 hover:text-blue-500 rounded-full transition
          ${active ? 'text-blue-500 bg-blue-100 dark:bg-slate-800' : ''}
        `"
      >
        {{ name || to }}
      </NuxtLink>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChevronRightIcon, ChevronUpIcon, MinusIcon } from '@heroicons/vue/20/solid'
const props = defineProps({
  separator: {
    type: Boolean,
    default: true
  },
  to: {
    type: String,
    default: '/'
  },
  name: {
    type: String,
    default: null
  }
})
const route = useRoute()
const active = computed(() => {
  return route.path === props.to
})
</script>
