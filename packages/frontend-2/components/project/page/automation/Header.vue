<template>
  <div class="flex flex-col">
    <CommonTextLink :icon-left="ArrowLeftIcon" size="xs" :to="automationsLink">
      Go Back to Automations
    </CommonTextLink>
    <div class="flex gap-1 items-center">
      <h1 class="block h4 font-bold">Automations</h1>
      <ChevronRightIcon class="w-5 h-5" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import { ChevronRightIcon } from '@heroicons/vue/24/solid'
import { projectRoute } from '~/lib/common/helpers/route'

const route = useRoute()
const projectId = computed(() => route.params.id as string)

const automationsLink = computed(() => projectRoute(projectId.value, 'automations'))
</script>
