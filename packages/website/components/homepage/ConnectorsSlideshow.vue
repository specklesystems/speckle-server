<template>
  <section class="relative py-16">
    <h2 class="text-center text-heading-lg mb-2 text-foreground-2">
      Integrating with all your authoring tools.
    </h2>
    <div
      class="logos group relative overflow-hidden whitespace-nowrap py-10 [mask-image:_linear-gradient(to_right,_transparent_0,_white_128px,white_calc(100%-128px),_transparent_100%)]"
    >
      <div
        class="animate-slide-left-infinite group-hover:animation-pause inline-block w-max"
      >
        <div
          v-for="(connector, idx) in connectors"
          :key="idx"
          class="inline-block grayscale hover:grayscale-0 transition"
        >
          <img
            class="mx-8 inline h-16 w-16 rounded-xl transition-all hover:scale-110"
            :src="connector.imageUrl"
            :alt="connector.name"
            :title="connector.name"
          />
          <div
            class="text-center text-body-sm text-foreground-2 opacity-0 group-hover:opacity-100 transition mt-2"
          >
            {{ connector.name }}
          </div>
        </div>
      </div>
      <div
        class="animate-slide-left-infinite group-hover:animation-pause inline-block w-max"
      >
        <div
          v-for="(connector, idx) in connectors"
          :key="idx"
          class="inline-block grayscale hover:grayscale-0 transition"
        >
          <img
            class="mx-8 inline h-16 w-16 rounded-xl transition-all hover:scale-110"
            :src="connector.imageUrl"
            :alt="connector.name"
            :title="connector.name"
          />
          <div
            class="text-center text-body-sm text-foreground-2 opacity-0 group-hover:opacity-100 transition mt-2"
          >
            {{ connector.name }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
const query = groq`*[_type == "connector"]{_id, name,  "imageUrl": image.asset->url}`

const { data: connectors } = useSanityQuery(query)
</script>
