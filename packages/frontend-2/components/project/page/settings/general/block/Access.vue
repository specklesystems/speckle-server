<template>
  <ProjectPageSettingsBlock title="Access">
    <template #logo><LockClosedIcon class="h-5 w-5" /></template>
    <template #introduction>
      <p>
        Choose how you want to share your projects with others. Select the option that
        best suits your needs:
      </p>
    </template>
    <FormRadioGroup v-model="selectedOption" :options="radioOptions" />
  </ProjectPageSettingsBlock>
</template>
<script setup lang="ts">
import {
  LockClosedIcon,
  UserGroupIcon,
  UserCircleIcon
} from '@heroicons/vue/24/outline'
import { FormRadioGroup } from '@speckle/ui-components'

const selectedOption = ref('discoverable')

const radioOptions = [
  {
    value: 'discoverable',
    title: 'Discoverable',
    introduction: 'Anyone can view and access your project',
    icon: UserGroupIcon
  },
  {
    value: 'shareable',
    title: 'Shareable Link',
    icon: UserCircleIcon,
    introduction: 'Anyone with the link can access'
  },
  {
    value: 'private',
    title: 'Private',
    icon: UserCircleIcon,
    introduction: 'Only team members will have access'
  }
]
</script>
