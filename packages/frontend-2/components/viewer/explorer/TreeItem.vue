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
      <div class="text-xs">{{ item.name || item.id }}</div>
    </div>
    <!-- Contents -->

    <div v-if="unfold" class="text-xs">
      <div v-for="(kvp, idx) in objKeyValues" :key="idx">
        {{ kvp.key }}: {{ kvp.type }}
      </div>
    </div>
    <!-- <div v-if="unfold" class="text-xs">Collections</div>
    <div v-if="unfold">{{ collectionObjectKeys }}</div>
    <div v-if="unfold">
      <div v-for="(key, idx) in atomicObjectKeys" :key="idx">
        <ViewerExplorerTreeItem :item="(item[key] as Record<string,unknown>)" />
      </div>
    </div>
    <div v-if="unfold" class="text-xs">Atomic objects</div>
    <div v-if="unfold">{{ atomicObjectKeys }}</div> -->
  </div>
</template>
<script setup lang="ts">
// TODO: typeguards for checking and casting to expected vals

import { ChevronDownIcon } from '@heroicons/vue/24/solid'
const props = defineProps<{
  item: Record<string, unknown>
}>()

const unfold = ref(false)

const objectKeys = computed(() => Object.keys(props.item))

const objKeyValues = computed(() => {
  const keys = Object.keys(props.item)
  const pairs = []
  for (const key of keys) {
    const pair = {
      key,
      value: props.item[key],
      type: ''
    }
    if (
      typeof props.item[key] === 'object' &&
      !Array.isArray(props.item[key]) &&
      props.item[key] !== null
    )
      pair.type = 'object'
    else if (Array.isArray(props.item[key])) pair.type = 'array'
    else pair.type = typeof props.item[key]
    pairs.push(pair)
  }
  return pairs
})

// if pair.type = object -> it's a direct descendant
// if pair.type = array -> it's a collection
// if pair

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
