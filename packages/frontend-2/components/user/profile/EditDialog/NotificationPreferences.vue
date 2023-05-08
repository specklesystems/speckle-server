<template>
  <div class="flex flex-col space-y-4">
    <div class="h4 font-bold flex items-center space-x-2">
      <BellIcon class="w-6 h-6" />
      <span>Notification preferences</span>
    </div>
    <table class="table-auto">
      <thead class="text-foreground-2 border-b">
        <tr>
          <th>Notification type</th>
          <th v-for="channel in notificationChannels" :key="channel">
            {{ capitalize(channel) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[type, settings] in Object.entries(localPreferences)" :key="type">
          <td>
            {{ notificationTypeMapping[type] || 'Unknown' }}
          </td>
          <td v-for="channel in notificationChannels" :key="channel">
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
</template>
<script setup lang="ts">
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
  newStreamAccessRequest: 'Stream access request',
  streamAccessRequestApproved: 'Stream access request approved'
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
