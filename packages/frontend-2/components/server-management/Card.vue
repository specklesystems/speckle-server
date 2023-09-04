<template>
  <div>
    <div class="bg-foundation p-4 flex flex-col gap-4 rounded-md shadow-md">
      <ServerManagementCardRow
        v-for="info in serverInfo"
        :key="info.title"
        :title="info.title"
        :value="info.value"
        :cta="info.cta"
        :icon="info.icon"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { CardInfo } from '~~/lib/server-management/helpers/types'

defineProps<{
  serverInfo: CardInfo[]
}>()
</script>
