<template>
  <PortableText :value="value" :components="portableTextComponents" />
</template>
<script setup lang="ts">
import { PortableText } from '@portabletext/vue'
import Image from '~/components/portabletext/Image.vue'
import Callout from '~/components/portabletext/Callout.vue'
import AccordionItem from '~/components/portabletext/AccordionItem.vue'

defineProps<{ value: TypedObject[] }>()
const portableTextComponents = {
  types: {
    image: Image,
    callout: Callout,
    accordionItem: AccordionItem
  }
}
</script>
