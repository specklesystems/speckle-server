<template>
  <div
    v-show="(query?.length || 0) >= 3"
    class="bg-foundation text-foreground rounded shadow-md p-2"
  >
    <ul>
      <template v-if="items.length">
        <li v-for="(item, i) in items" :key="item.id">
          <CommonTiptapMentionListItem
            :item="item"
            :is-selected="i === selectedIndex"
            @click="() => selectItem(i)"
          />
        </li>
      </template>
      <template v-else>
        <li>Couldn't find anything 🤷</li>
      </template>
    </ul>
  </div>
</template>
<script setup lang="ts">
import type { SuggestionKeyDownProps } from '@tiptap/suggestion'
import type {
  MentionData,
  SuggestionOptionsItem
} from '~~/lib/core/tiptap/mentionExtension'

const props = defineProps<{
  query?: string
  items?: SuggestionOptionsItem[]
  command: (mention: MentionData) => void
}>()

const selectedIndex = ref(0)

const items = computed(() => props.items || [])

const upHandler = () => {
  if (!items.value) return

  selectedIndex.value =
    (selectedIndex.value + items.value.length - 1) % items.value.length
}
const downHandler = () => {
  if (!items.value) return

  selectedIndex.value = (selectedIndex.value + 1) % items.value.length
}

const selectItem = (index: number) => {
  if (!items.value) return

  const item = items.value[index]
  if (item) {
    props.command({ id: item.id, label: item.name })
  }
}

const enterHandler = () => {
  if (!items.value) return

  selectItem(selectedIndex.value)
}

const onKeyDown = (params: SuggestionKeyDownProps) => {
  const { event } = params
  if (event.key === 'ArrowUp') {
    upHandler()
    return true
  }
  if (event.key === 'ArrowDown') {
    downHandler()
    return true
  }
  if (event.key === 'Enter') {
    enterHandler()
    return true
  }
  return false
}

watch(
  () => props.items,
  () => (selectedIndex.value = 0)
)

defineExpose({
  onKeyDown
})
</script>
