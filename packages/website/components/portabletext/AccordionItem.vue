<template>
  <details
    class="rounded-xl bg-foundation-page border border-outline-2 p-2 transition-all shadow [&_svg]:open:-rotate-180"
    :open="value.defaultOpen"
  >
    <summary
      class="flex py-2 space-x-2 cursor-pointer list-none hover:text-primary font-medium text-body transition-all"
    >
      <ChevronDownIcon class="w-4 transition-all" />
      <span>{{ value.title }}</span>
    </summary>
    <div class="prose dark:prose-invert text-foreground-2 px-2">
      <PortableText :value="value.content" :components="myPortableTextComponents" />
    </div>
  </details>
</template>
<script setup lang="ts">
import { PortableText } from '@portabletext/vue'
import Image from '~/components/portabletext/Image.vue'
import Callout from '~/components/portabletext/Callout.vue'
import AccordionItem from '~/components/portabletext/AccordionItem.vue'
import { ChevronDownIcon } from '@heroicons/vue/24/solid'

const props = defineProps<{ value: Record<string, unknown> }>()

const myPortableTextComponents = {
  types: {
    image: Image,
    callout: Callout,
    accordionItem: AccordionItem
  }
}
</script>
