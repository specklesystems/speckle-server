<template>
  <div v-tippy="getTooltipProps(isHidden ? 'Show' : 'Hide')">
    <FormButton
      color="subtle"
      size="sm"
      :icon-left="isHidden ? EyeClosed : Eye"
      hide-text
      @click.stop="$emit('click', $event)"
    >
      {{ isHidden ? 'Show' : 'Hide' }}
    </FormButton>
  </div>
</template>

<script setup lang="ts">
import { FormButton } from '@speckle/ui-components'
import { Eye, EyeClosed } from 'lucide-vue-next'

defineProps<{
  isHidden: boolean
  forceVisible?: boolean
}>()

defineEmits<{
  click: [event: Event]
}>()

const { getTooltipProps } = useSmartTooltipDelay()
</script>
