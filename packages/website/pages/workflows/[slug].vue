<template>
  <div class="">
    <div
      class="z-10 mt-20 mb-20 space-y-8 max-w-prose mx-auto text-center flex flex-col"
    >
      <div>
        <CommonBadge size="lg">
          Speckle for
          <b>{{ workflow?.useCase.title }}</b>
        </CommonBadge>
      </div>
      <h1 class="text-5xl mt-12 tracking-tight">
        <b>{{ workflow?.source.name }}</b>
        to
        <b>{{ workflow?.receiver.name }}</b>
      </h1>
      <h2 class="text-heading-lg mt-12 text-foreground-2">
        Teams around the world use Speckle for instant business intelligence, design
        coordination and automation.
      </h2>
      <div>
        <FormButton>Get Speckle Free</FormButton>
      </div>
      <div class="flex space-x-2 justify-center">
        <div
          class="w-20 bg-highlight-2 p-2 rounded-lg shadow-md border border-2 border-transparent hover:border-outline-3 transition-all flex items-center justify-center"
        >
          <NuxtImg :src="workflow?.source.imageUrl" class="rounded-md" />
        </div>
        <div class="flex items-center text-foreground-2">
          <ChevronRightIcon class="w-10" />
        </div>
        <div
          class="w-20 bg-highlight-2 p-2 rounded-lg shadow-md border border-2 border-transparent hover:border-outline-3 transition-all flex items-center justify-center"
        >
          <NuxtImg :src="workflow?.receiver.imageUrl" class="rounded-md" />
        </div>
      </div>
    </div>
    <article v-if="workflow" class="my-20 prose dark:prose-invert mx-auto px-2 md:px-0">
      <PortableText :value="workflow.content" :components="myPortableTextComponents" />
    </article>
  </div>
</template>
<script setup lang="ts">
import { PortableText } from '@portabletext/vue'
import { ChevronRightIcon } from '@heroicons/vue/24/solid'
import Image from '~/components/portabletext/Image.vue'
import Callout from '~/components/portabletext/Callout.vue'
import AccordionItem from '~/components/portabletext/AccordionItem.vue'
const query = groq`*[_type == "workflow" && slug.current==$slug][0] {title, content, useCase->{title}, source -> {name, "imageUrl": image.asset->url}, receiver -> {name, "imageUrl": image.asset->url}}`
const route = useRoute()

const { data: workflow } = useSanityQuery(query, { slug: route.params.slug })

const myPortableTextComponents = {
  types: {
    image: Image,
    callout: Callout,
    accordionItem: AccordionItem
  }
}
</script>
