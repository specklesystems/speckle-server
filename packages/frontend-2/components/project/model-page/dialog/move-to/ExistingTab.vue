<template>
  <div class="flex flex-col space-y-2">
    <CommonModelSelector v-model="value" :project-id="projectId" />
  </div>
</template>
<script setup lang="ts">
import { Optional } from '@speckle/shared'
import { CommonModelSelectorModelFragment } from '~~/lib/common/generated/gql/graphql'

defineProps<{
  projectId: string
}>()

const value = ref(undefined as Optional<CommonModelSelectorModelFragment>)
</script>
