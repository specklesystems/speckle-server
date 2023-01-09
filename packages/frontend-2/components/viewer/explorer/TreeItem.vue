<template>
  <!--     -->
  <!-- WIP -->
  <!--     -->
  <div class="bg-foundation rounded-md p-2 shadow w-full">
    <!-- Header -->
    <div class="flex items-center">
      <div>
        <button @click="unfold = !unfold">
          <ChevronDownIcon
            :class="`w-5 h-5 transition ${!unfold ? 'rotate-0' : 'rotate-180'}`"
          />
        </button>
      </div>
      <div>{{ item.name || item.id }}</div>
    </div>
    <!-- Contents -->
    <div v-if="unfold" class="text-xs">Collections</div>
    <div v-if="unfold">{{ collectionObjectKeys }}</div>
    <div v-if="unfold">
      <div v-for="(key, idx) in atomicObjectKeys" :key="idx">
        <ViewerExplorerTreeItem :item="(item[key] as Record<string,unknown>)" />
      </div>
    </div>
    <div v-if="unfold" class="text-xs">Atomic objects</div>
    <div v-if="unfold">{{ atomicObjectKeys }}</div>
  </div>
</template>
<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/24/solid'
const props = defineProps<{
  item: Record<string, unknown>
}>()

const unfold = ref(false)

const objectKeys = computed(() => Object.keys(props.item))

const collectionObjectKeys = computed(() => {
  const all = []
  for (const k of objectKeys.value) if (Array.isArray(props.item[k])) all.push(k)
  return all
})

const atomicObjectKeys = computed(() => {
  const all = []
  for (const k of objectKeys.value) {
    if (
      typeof props.item[k] === 'object' &&
      !Array.isArray(props.item[k]) &&
      props.item[k] !== null
    )
      all.push(k)
  }
  return all
})
</script>
