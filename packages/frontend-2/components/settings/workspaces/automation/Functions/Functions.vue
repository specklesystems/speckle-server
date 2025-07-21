<template>
  <div class="flex flex-col gap-4">
    <SettingsSectionHeader
      subheading
      title="Functions"
      :buttons="functionsSectionButtons"
    >
      <p class="text-body-xs text-foreground-2 mt-2">
        View and manage functions accessible only to projects in your workspace
      </p>
    </SettingsSectionHeader>
    <LayoutTable
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3' },
        { id: 'owner', header: 'Owner', classes: 'col-span-3' },
        { id: 'id', header: 'ID', classes: 'col-span-5' },
        { id: 'actions', header: '', classes: 'col-span-1 flex justify-end' }
      ]"
      :items="workspaceFunctions"
    >
      <template #name="{ item }">
        <div class="flex items-center gap-2">
          <AutomateFunctionLogo size="md" :logo="item.logo" />
          <NuxtLink
            class="text-foreground-3 hover:text-foreground-2 underline"
            :to="automateFunctionRoute(item.id)"
          >
            {{ item.name }}
          </NuxtLink>
        </div>
      </template>
      <template #owner="{ item }">
        <div class="flex items-center gap-2">
          <UserAvatar
            hide-tooltip
            :user="item.creator"
            light-style
            class="bg-foundation"
            no-bg
          />
          <span class="truncate text-body-xs text-foreground">
            {{ item.creator?.name }}
          </span>
        </div>
      </template>
      <template #id="{ item }">
        <div class="flex items-center text-foreground-2">
          {{ item.id }}
          <ClipboardIcon
            class="w-4 h-4 ml-2 cursor-pointer hover:text-foreground transition"
            @click="() => handleCopyText(item.id)"
          />
        </div>
      </template>
      <template #actions="{ item }">
        <SettingsWorkspacesAutomationFunctionsTableRowActions
          :workspace-function="item"
          :permissions="item.permissions"
        />
      </template>
    </LayoutTable>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesAutomationFunctions_AutomateFunctionFragment } from '~/lib/common/generated/gql/graphql'
import { automateFunctionRoute } from '~/lib/common/helpers/route'
import { ClipboardIcon } from '@heroicons/vue/24/outline'
import type { LayoutHeaderButton } from '@speckle/ui-components'

graphql(`
  fragment SettingsWorkspacesAutomationFunctions_AutomateFunction on AutomateFunction {
    id
    name
    logo
    creator {
      id
      name
      avatar
    }
    ...SettingsWorkspacesAutomationTableRowActions_AutomateFunction
  }
`)

defineProps<{
  workspaceFunctions: SettingsWorkspacesAutomationFunctions_AutomateFunctionFragment[]
}>()

const { copy } = useClipboard()

const functionsSectionButtons = computed<LayoutHeaderButton[]>(() => [
  {
    props: {
      color: 'outline',
      to: 'https://speckle.guide/automate/create-function.html',
      target: '_blank',
      external: true
    },
    label: 'Open docs'
  }
])

const handleCopyText = (text: string) => {
  copy(text)
}
</script>
