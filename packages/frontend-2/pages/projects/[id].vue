<template>
  <div>
    <div class="relative">
      <h1 class="h2 font-bold mt-10">Where everything started</h1>
      <NuxtLink class="absolute -left-10 top-2.5" :to="homeRoute">
        <ArrowLeftIcon class="h-6 w-6" />
      </NuxtLink>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ArrowLeftIcon } from '@heroicons/vue/24/solid'
import { graphql } from '~~/lib/common/generated/gql'
import { homeRoute } from '~~/lib/common/helpers/route'

graphql(`
  fragment ProjectPageProject on Project {
    id
    name
    description
  }
`)

definePageMeta({
  middleware: ['require-valid-project']
})
</script>
