<template>
  <section>
    <div class="flex items-center justify-between gap-4 mt-8 mb-4">
      <div class="flex items-center gap-2">
        <h1 class="h4 text-foreground font-bold flex items-center">
          {{ title }}
          <span class="ml-2 caption text-foreground-2">{{ numModels }}</span>
        </h1>
      </div>
      <div v-if="enableSearch">
        <FormTextInput
          name="model-search"
          label="Search Models"
          placeholder="search"
          class="bg-foundation shadow hover:shadow-lg"
        />
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <ModelCard
        v-for="model in models.slice(0, numModels)"
        :key="model.name"
        :model="model"
      />
    </div>
    <!-- <div v-else>YO MAKE SOME PROJECTS</div> -->
  </section>
</template>
<script setup lang="ts">
defineProps({
  /** Enable search or not */
  enableSearch: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: 'Your Models'
  },
  numModels: {
    type: Number,
    default: 4
  }
})

const models = [
  {
    name: 'Office Building With A Really Long Name That Does Not Fit',
    previewUrl: 'https://latest.speckle.dev/preview/7d051a6449/commits/810f4e1bec',
    preview360Url: 'https://latest.speckle.dev/preview/28dd9ad7ba/all',
    numVersions: 4
  },
  {
    name: 'Short',
    previewUrl: 'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70',
    preview360Url:
      'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70/all',
    numVersions: 20
  },
  {
    name: 'Import',
    previewUrl: 'https://latest.speckle.dev/preview/499056027e/commits/00f3a58cb6',
    numVersions: 10,
    preview360Url: 'https://latest.speckle.dev/preview/28dd9ad7ba/all'
  },
  {
    name: 'Import',
    previewUrl: 'https://latest.speckle.dev/preview/499056027e/commits/0bd399bdf8',
    numVersions: 2,
    preview360Url: 'https://latest.speckle.dev/preview/28dd9ad7ba/all'
  },
  {
    name: 'Sent something from Dynamo',
    previewUrl: 'https://latest.speckle.dev/preview/28dd9ad7ba/commits/8adba9f29c',
    numVersions: 2,
    preview360Url: 'https://latest.speckle.dev/preview/28dd9ad7ba/all'
  },
  {
    name: 'Cute Little Dragon',
    previewUrl: 'https://latest.speckle.dev/preview/28dd9ad7ba/commits/a819e40ce4',
    numVersions: 2,
    preview360Url: 'https://latest.speckle.dev/preview/28dd9ad7ba/all'
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
  },
  {
    name: 'Office Building With A Really Long Name That Does Not Fit',
    previewUrl: 'https://latest.speckle.dev/preview/7d051a6449/commits/810f4e1bec',
    preview360Url: 'https://latest.speckle.dev/preview/28dd9ad7ba/all',
    numVersions: 4
  },
  {
    name: 'Short',
    previewUrl: 'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70',
    preview360Url:
      'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70/all',
    numVersions: 20
  },
  {
    name: 'Import',
    previewUrl: 'https://latest.speckle.dev/preview/499056027e/commits/00f3a58cb6',
    numVersions: 10,
    preview360Url: 'https://latest.speckle.dev/preview/28dd9ad7ba/all'
  },
  {
    name: 'Import',
    previewUrl: 'https://latest.speckle.dev/preview/499056027e/commits/0bd399bdf8',
    numVersions: 2,
    preview360Url: 'https://latest.speckle.dev/preview/28dd9ad7ba/all'
  },
  {
    name: 'Sent something from Dynamo',
    previewUrl: 'https://latest.speckle.dev/preview/28dd9ad7ba/commits/8adba9f29c',
    numVersions: 2,
    preview360Url: 'https://latest.speckle.dev/preview/28dd9ad7ba/all'
  },
  {
    name: 'Cute Little Dragon',
    previewUrl: 'https://latest.speckle.dev/preview/28dd9ad7ba/commits/a819e40ce4',
    numVersions: 2,
    preview360Url: 'https://latest.speckle.dev/preview/28dd9ad7ba/all'
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
