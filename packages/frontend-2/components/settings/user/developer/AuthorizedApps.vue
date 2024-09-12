<template>
  <div class="flex flex-col gap-4">
    <SettingsSectionHeader
      subheading
      title="Authorized Apps"
      :buttons="[
        {
          props: {
            color: 'outline',
            to: 'https://speckle.guide/dev/apps.html',
            target: '_blank',
            external: true,
            iconLeft: BookOpenIcon
          },
          label: 'Open docs'
        }
      ]"
    >
      <p class="text-sm pt-6 md:pt-4">
        Here you can review the apps that you have granted access to. If something looks
        suspicious, revoke the access.
      </p>
    </SettingsSectionHeader>
    <LayoutTable
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3 ' },
        { id: 'author', header: 'Author', classes: 'col-span-3 ' },
        {
          id: 'description',
          header: 'Description',
          classes: 'col-span-6 !pt-1.5'
        }
      ]"
      :items="authorizedApps"
      :buttons="[
        {
          icon: XMarkIcon,
          label: 'Revoke Access',
          action: (item) => $emit('delete', item),
          class: 'text-danger'
        }
      ]"
      row-items-align="stretch"
    >
      <template #name="{ item }">
        {{ item.name }}
      </template>
      <template #author="{ item }">
        <div class="flex space-x-2 items-center">
          <template v-if="item.author">
            <UserAvatar :user="item.author" />
            <span>{{ item.author.name }}</span>
          </template>
          <template v-else>
            <HeaderLogoBlock minimal no-link />
            <span>Speckle</span>
          </template>
        </div>
      </template>
      <template #description="{ item }">
        {{ item.description }}
      </template>
    </LayoutTable>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { BookOpenIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { developerSettingsAuthorizedAppsQuery } from '~~/lib/developer-settings/graphql/queries'
import type { AuthorizedAppItem } from '~~/lib/developer-settings/helpers/types'

defineEmits<{
  (e: 'delete', item: AuthorizedAppItem): void
}>()

const { result: authorizedAppsResult } = useQuery(developerSettingsAuthorizedAppsQuery)

const authorizedApps = computed(() =>
  (authorizedAppsResult.value?.activeUser?.authorizedApps || []).filter(
    (app) => app.id !== 'spklwebapp'
  )
)
</script>
