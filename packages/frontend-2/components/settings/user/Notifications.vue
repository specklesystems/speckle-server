<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Notifications"
        text="Your notification preferences"
      />
      <table class="table-auto w-full rounded-t overflow-hidden">
        <thead class="text-foreground-1">
          <tr>
            <th class="pb-4 font-medium text-sm text-left">Notification type</th>
            <th
              v-for="channel in notificationChannels"
              :key="channel"
              class="text-right font-medium pb-4 text-sm"
            >
              {{ capitalize(channel) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="[type, settings] in Object.entries(localPreferences)"
            :key="type"
            class="border-t border-outline-3"
          >
            <td class="text-body-xs py-4">
              {{ notificationTypeMapping[type] || 'Unknown' }}
            </td>
            <td
              v-for="channel in notificationChannels"
              :key="channel"
              class="flex justify-end py-4"
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
    </div>
  </section>
</template>
<script setup lang="ts">
import { capitalize, cloneDeep } from 'lodash-es'
import { graphql } from '~~/lib/common/generated/gql'
import { useUpdateNotificationPreferences } from '~~/lib/user/composables/management'
import type { NotificationPreferences } from '~~/lib/user/helpers/components'
import type { SettingsUserNotifications_UserFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment SettingsUserNotifications_User on User {
    id
    notificationPreferences
  }
`)

const props = defineProps<{
  user: SettingsUserNotifications_UserFragment
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
