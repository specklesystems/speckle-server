<template>
  <LayoutDialogSection title="Notification preferences" border-t border-b>
    <template #icon>
      <BellIcon class="h-full w-full" />
    </template>
    <table class="table-auto w-full rounded-t overflow-hidden">
      <thead class="text-foreground-1">
        <tr>
          <th class="bg-primary-muted py-2 px-4">Notification type</th>
          <th
            v-for="channel in notificationChannels"
            :key="channel"
            class="bg-primary-muted text-right py-2 px-4"
          >
            {{ capitalize(channel) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[type, settings] in Object.entries(localPreferences)" :key="type">
          <td class="px-4 pb-1 pt-2 text-xs sm:text-sm">
            {{ notificationTypeMapping[type] || 'Unknown' }}
          </td>
          <td
            v-for="channel in notificationChannels"
            :key="channel"
            class="flex justify-end pt-2 pr-4"
          >
            <FormCheckbox
              :name="`${type} (${channel})`"
              :disabled="loading"
              hide-label
              :model-value="settings[channel] || undefined"
              @update:model-value="
                ($event) => onUpdate({ value: !!$event, type, channel })
              "
            />
          </td>
        </tr>
      </tbody>
    </table>
  </LayoutDialogSection>
</template>
<script setup lang="ts">
import { LayoutDialogSection } from '@speckle/ui-components'
import { BellIcon } from '@heroicons/vue/24/outline'
import { capitalize, cloneDeep } from 'lodash-es'
import { graphql } from '~~/lib/common/generated/gql'
import { UserProfileEditDialogNotificationPreferences_UserFragment } from '~~/lib/common/generated/gql/graphql'
import { useUpdateNotificationPreferences } from '~~/lib/user/composables/management'
import { NotificationPreferences } from '~~/lib/user/helpers/components'

graphql(`
  fragment UserProfileEditDialogNotificationPreferences_User on User {
    id
    notificationPreferences
  }
`)

const props = defineProps<{
  user: UserProfileEditDialogNotificationPreferences_UserFragment
}>()

const { mutate, loading } = useUpdateNotificationPreferences()

const notificationTypeMapping = ref({
  activityDigest: 'Weekly activity digest',
  mentionedInComment: 'Mentioned in comment',
  newStreamAccessRequest: 'Project access request',
  streamAccessRequestApproved: 'Project access request approved'
} as Record<string, string>)

const localPreferences = ref({} as NotificationPreferences)

const notificationPreferences = computed(
  () => props.user.notificationPreferences as NotificationPreferences
)

const notificationChannels = computed(() => {
  const firstTypeSettings = Object.values(notificationPreferences.value)[0] || {}
  return Object.keys(firstTypeSettings)
})

const onUpdate = async (params: { value: boolean; channel: string; type: string }) => {
  const { value, channel, type } = params
  localPreferences.value[type][channel] = value
  await mutate(localPreferences.value)
}

watch(
  notificationPreferences,
  (prefs) => {
    localPreferences.value = cloneDeep(prefs)
  },
  { immediate: true, deep: true }
)
</script>
