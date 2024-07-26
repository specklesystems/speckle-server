<template>
  <div class="flex flex-col space-y-2 items-center justify-center p-4 min-h-32">
    <div class="text-sm mb-2">
      <slot>No data found!</slot>
    </div>
    <FormButton v-if="cta" :to="cta?.to" color="outline" @click="onCtaClick">
      {{ cta.text }}
    </FormButton>
  </div>
</template>
<script setup lang="ts">
// gotta import something otherwise eslint breaks...
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { homeRoute } from '~/lib/common/helpers/route'

const props = defineProps<{
  cta?: {
    text: string
    onClick?: (e: MouseEvent) => void
    to?: string
  }
}>()

const onCtaClick = (e: MouseEvent) => {
  if (props.cta?.onClick) {
    props.cta.onClick(e)
  }
}
</script>
