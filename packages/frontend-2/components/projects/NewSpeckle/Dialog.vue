<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <h2 class="text-2xl sm:text-3xl font-bold text-center sm:-mt-4 mb-2">
      What's New in Speckle?
    </h2>
    <p class="text-foreground-2 text-center mb-6">A new way to collaborate in AEC.</p>
    <CommonVimeoEmbed
      vimeo-id="925455838"
      title="What's new in Speckle?"
      autoplay
      muted
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
import { CommonVimeoEmbed, type LayoutDialogButton } from '@speckle/ui-components'

const open = defineModel<boolean>('open', { required: true })

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Close',
    props: { color: 'secondary', fullWidth: true },
    onClick: () => {
      open.value = false
    }
  },
  {
    text: 'Learn more',
    props: {
      color: 'default',
      fullWidth: true,
      outline: true,
      iconRight: ArrowTopRightOnSquareIcon,
      to: 'https://speckle.systems/blog/the-new-way-to-collaborate-in-aec/',
      external: true,
      target: '_blank'
    }
  }
])
</script>
