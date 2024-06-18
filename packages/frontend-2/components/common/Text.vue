<template>
  <span>{{ text ?? '' }}</span>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'

/**
 * Use this when rendering text that can cause hydration mismatches (e.g. "X minutes ago" which can be off by a second between server and client rendering)
 * If a hydration mismatch will happen only this component will be re-mounted, instead of the entire parent component
 */

defineProps<{
  text: MaybeNullOrUndefined<string | number>
}>()
</script>
