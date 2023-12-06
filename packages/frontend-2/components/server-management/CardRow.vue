<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-1 text-foreground-2 text-sm">
      <Component :is="icon" class="h-4 w-4" />
      <span>{{ title }}</span>
    </div>
    <div class="flex justify-between items-center gap-4 sm:gap-8">
      <span class="text-xl sm:text-2xl font-bold">{{ value }}</span>
      <template v-if="cta?.type === 'button'">
        <FormButton @click="cta?.action">
          {{ cta.label }}
        </FormButton>
      </template>
      <template v-else-if="cta?.type === 'link'">
        <FormButton
          color="invert"
          class="shrink-0"
          :icon-right="ArrowTopRightOnSquareIcon"
          @click="cta?.action"
        >
          {{ cta.label }}
        </FormButton>
      </template>
      <template v-else-if="cta?.type === 'text'">
        <div
          class="flex items-center gap-1 text-xs text-center sm:text-sm opacity-50 shrink-0"
        >
          <CheckCircleIcon class="h-4 w-4" />
          {{ cta.label }}
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ArrowTopRightOnSquareIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import type { ConcreteComponent } from 'vue'
import type { CTA } from '~~/lib/server-management/helpers/types'

defineEmits<{
  (e: 'cta-clicked', v: MouseEvent): void
}>()

defineProps<{
  title: string
  value: string
  icon: ConcreteComponent
  cta?: CTA
}>()
</script>
