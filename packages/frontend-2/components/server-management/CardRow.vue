<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-1 text-foreground-2 text-sm">
      <span>{{ title }}</span>
    </div>
    <div class="flex justify-between items-center gap-8">
      <span class="text-2xl font-bold">{{ value }}</span>
      <template v-if="cta && cta.type === 'button'">
        <FormButton @click="handleClick">
          {{ cta.label }}
        </FormButton>
      </template>
      <template v-else-if="cta && cta.type === 'link'">
        <FormButton
          color="invert"
          class="shrink-0"
          :icon-right="ArrowTopRightOnSquareIcon"
          @click="showDialog = true"
        >
          {{ cta.label }}
        </FormButton>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits(['cta-clicked'])

const showDialog = ref(false)
const props = defineProps({
  title: String,
  value: String,
  cta: Object
})

function handleClick() {
  if (props.cta && typeof props.cta.action === 'function') {
    ;(props.cta.action as () => void | Promise<void>)()
  } else {
    emit('cta-clicked')
  }
}
</script>
