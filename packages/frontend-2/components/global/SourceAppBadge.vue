<template>
  <CommonBadge
    color-classes="text-foreground-on-primary"
    rounded
    :style="{ backgroundColor: sourceApp.bgColor }"
  >
    {{ sourceApp.short }}
  </CommonBadge>
</template>
<script setup lang="ts">
import { SourceAppDefinition } from '@speckle/shared'

defineProps<{
  sourceApp: SourceAppDefinition
}>()
</script>
