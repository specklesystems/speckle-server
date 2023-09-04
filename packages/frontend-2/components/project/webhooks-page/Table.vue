<template>
  <LayoutTable
    :headers="headers"
    :items="webhooks"
    :buttons="buttons"
    :column-classes="columnClasses"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { LayoutTable } from '@speckle/ui-components'
import { TrashIcon, PencilIcon } from '@heroicons/vue/24/outline'

const headers = [
  { id: 'state', title: 'State' },
  { id: 'data', title: 'Data' },
  { id: 'triggerEvents', title: 'Trigger Events' }
]

const webhooks = ref([
  {
    id: '1',
    state: 'Webhook 1',
    data: 'http://example.com/webhook1',
    triggerEvents: 'secret123'
  },
  {
    id: '2',
    state: 'Webhook 2',
    data: 'http://example.com/webhook2',
    triggerEvents: 'secret456'
  }
])

const buttons = [
  {
    icon: PencilIcon,
    label: 'Edit',
    action: (item) => console.log('Delete', item),
    class: 'text-primary'
  },
  {
    icon: TrashIcon,
    label: 'Delete',
    action: (item) => console.log('Delete', item),
    class: 'text-red-500'
  }
]

const columnClasses = {
  state: 'col-span-1',
  data: 'col-span-5 truncate',
  triggerEvents: 'col-span-6 truncate'
}
</script>
