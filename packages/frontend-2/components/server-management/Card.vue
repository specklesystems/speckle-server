<template>
  <div>
    <div class="bg-foundation p-4 flex flex-col gap-4 rounded-md shadow-md">
      <CardRow
        v-for="(info, index) in serverInfo"
        :key="index"
        :title="info.title"
        :value="info.value"
        :cta="info.cta"
        :icon="info.icon"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import CardRow from './CardRow.vue'
import { ConcreteComponent } from 'vue'
import { CTA } from '~~/lib/server-management/helpers/types'

export interface CardInfo {
  title: string
  value: string
  cta?: CTA
  icon: ConcreteComponent
}

defineProps({
  serverInfo: {
    type: Array as () => CardInfo[],
    required: true
  }
})
</script>
