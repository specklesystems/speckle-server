<template>
  <LayoutDialog v-model:open="open" max-width="md" title="Function Parameters">
    <div class="flex flex-col space-y-4">
      <template v-if="finalParams">
        <FormJsonForm :schema="finalParams" />
        <LayoutDialogSection
          title="Parameter schema"
          :icon="BeakerIcon"
          border-t
          border-b
        >
          <FormTextArea
            name="actionYaml"
            readonly
            :model-value="JSON.stringify(finalParams, null, 2)"
            class="text-sm text-primary"
            rows="15"
          />
        </LayoutDialogSection>
      </template>
      <CommonAlert v-else color="info">
        <template #title>
          No parameters defined for the selected function release
        </template>
      </CommonAlert>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { BeakerIcon } from '@heroicons/vue/24/outline'
import { LayoutDialogSection } from '@speckle/ui-components'
import { formatVersionParams } from '~/lib/automate/helpers/jsonSchema'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateFunctionPageParametersDialog_AutomateFunctionReleaseFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment AutomateFunctionPageParametersDialog_AutomateFunctionRelease on AutomateFunctionRelease {
    id
    inputSchema
  }
`)

const props = defineProps<{
  release: AutomateFunctionPageParametersDialog_AutomateFunctionReleaseFragment
}>()

const open = defineModel<boolean>('open', { required: true })
const finalParams = computed(() => formatVersionParams(props.release.inputSchema))
</script>
