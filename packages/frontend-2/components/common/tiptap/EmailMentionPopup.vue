<template>
  <div class="bg-foundation text-foreground rounded shadow-md p-2">
    <CommonTiptapMentionListItem
      v-if="existingUser"
      :item="existingUser"
      is-selected
      @click="enterHandler"
    />
    <FormButton v-else @click="enterHandler">Invite {{ query }}</FormButton>
  </div>
</template>
<script setup lang="ts">
import type {
  SuggestionCommandProps,
  SuggestionKeyDownProps
} from '~~/lib/core/tiptap/email-mention/suggestion'
import type { SuggestionOptionsItem } from '~~/lib/core/tiptap/mentionExtension'

const props = defineProps<{
  query: string
  items: SuggestionOptionsItem[]
  command: (mention: SuggestionCommandProps) => void
}>()

const existingUser = computed(() => props.items[0] || null)

const enterHandler = () => {
  if (existingUser.value) {
    // Create a mention of the existing user
    props.command({
      mention: { id: existingUser.value.id, label: existingUser.value.name },
      email: null
    })
  } else {
    // Trigger invite and close popup
    props.command({
      email: props.query,
      mention: null
    })
  }
}

const onKeyDown = (params: SuggestionKeyDownProps) => {
  const { event } = params
  if (event.key === 'Enter') {
    enterHandler()
    return true
  }
  return false
}

defineExpose({
  onKeyDown
})
</script>
