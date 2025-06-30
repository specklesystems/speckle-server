<template>
  <button class="text-foreground-2 hover:text-foreground text-body-3xs inline-block">
    <span>
      {{
        (title ||
          "If you'd like help from the server administrators, click to copy the error reference.") +
        ' '
      }}
    </span>
    <ClipboardIcon class="w-3 h-3 shrink-0 inline" />
  </button>
</template>
<script setup lang="ts">
import { ClipboardIcon } from '@heroicons/vue/24/outline'

defineProps<{
  title?: string
}>()
</script>
