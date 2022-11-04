<template>
  <section>
    <div class="flex items-center justify-between gap-4 my-8">
      <div class="flex items-center gap-4">
        <h1 class="h4 font-bold flex items-center">
          Your Models
          <span class="ml-2 caption">{{ count }}</span>
        </h1>
      </div>
      <div v-if="enableSearch">
        <FormTextInput name="" label="" placeholder="search" />
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <ModelCard v-for="model in models" :key="model.name" :model="model" />
    </div>
    <!-- <div v-else>YO MAKE SOME PROJECTS</div> -->
  </section>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'

defineProps({
  /** Enable search or not */
  enableSearch: {
    type: Boolean,
    default: true
  }
})

const models = [
  {
    name: 'Office Building With A Really Long Name That Does Not Fit',
    previewUrl: 'https://latest.speckle.dev/preview/7d051a6449/commits/810f4e1bec',
    numVersions: 4
  },
  {
    name: 'Short',
    previewUrl: 'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70',
    numVersions: 20
  },
  {
    name: 'Import',
    previewUrl: 'https://latest.speckle.dev/preview/499056027e/commits/00f3a58cb6',
    numVersions: 10
  },
  {
    name: 'Import',
    previewUrl: 'https://latest.speckle.dev/preview/499056027e/commits/0bd399bdf8',
    numVersions: 2
  },
  {
    name: 'Sent something from Dynamo',
    previewUrl: 'https://latest.speckle.dev/preview/28dd9ad7ba/commits/8adba9f29c',
    numVersions: 2
  },
  {
    name: 'Cute Little Dragon',
    previewUrl: 'https://latest.speckle.dev/preview/28dd9ad7ba/commits/a819e40ce4',
    numVersions: 2
  },
  {
    name: 'Office Building With A Really Long Name That Does Not Fit',
    previewUrl: 'https://latest.speckle.dev/preview/7d051a6449/commits/810f4e1bec',
    numVersions: 4
  },
  {
    name: 'Short',
    previewUrl: 'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70',
    numVersions: 20
  }
]
</script>
