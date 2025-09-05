<template>
  <div class="px-1">
    <button
      class="w-full h-9 px-1.5 text-foreground rounded-md hover:bg-highlight-1 text-left flex items-center gap-3"
      :class="!property.parentPath ? 'py-1.5' : 'py-1'"
      @click="$emit('selectProperty', property.value)"
    >
      <Hash
        v-if="property.type === FilterType.Numeric"
        class="h-3 w-3 stroke-emerald-700 dark:stroke-emerald-500"
      />
      <CaseUpper v-else class="h-3 w-3 stroke-violet-600 dark:stroke-violet-500" />
      <div class="min-w-0 flex-1">
        <div
          v-if="property.label"
          class="text-body-2xs font-medium text-foreground truncate"
        >
          {{ property.label }}
        </div>
        <div v-else class="text-body-2xs font-medium text-foreground italic">null</div>
        <div
          v-if="property.parentPath"
          class="text-body-3xs text-foreground-3 truncate -mt-0.5"
        >
          {{ property.parentPath }}
        </div>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Hash, CaseUpper } from 'lucide-vue-next'
import type { PropertyOption } from '~/lib/viewer/helpers/filters/types'
import { FilterType } from '~/lib/viewer/helpers/filters/types'

defineProps<{
  property: PropertyOption
}>()

defineEmits<{
  selectProperty: [propertyKey: string]
}>()
</script>
