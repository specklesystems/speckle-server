<template>
  <LayoutDialog
    v-model:open="open"
    :buttons="dialogButtons"
    max-width="md"
    title="Function parameters"
  >
    <div class="flex flex-col space-y-4">
      <template v-if="finalParams">
        <FormJsonForm :schema="finalParams" />
        <LayoutDialogSection title="Parameter schema" border-t border-b>
          <FormTextArea
            name="actionYaml"
            readonly
            :model-value="JSON.stringify(finalParams, null, 2)"
            textarea-classes="!bg-foundation !border border-outline-2 p-2 rounded-lg font-mono !font-body-2xs"
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
import { LayoutDialogSection } from '@speckle/ui-components'
import { formatVersionParams } from '~/lib/automate/helpers/jsonSchema'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateFunctionPageParametersDialog_AutomateFunctionReleaseFragment } from '~/lib/common/generated/gql/graphql'
import type { LayoutDialogButton } from '@speckle/ui-components'

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

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Close',
    props: { color: 'outline' },
    onClick: () => (open.value = false)
  }
])
</script>
