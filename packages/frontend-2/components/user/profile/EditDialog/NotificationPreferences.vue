<template>
  <div class="flex flex-col border-t">
    <div
      class="flex justify-between items-center gap-8 cursor-pointer py-4 px-2 hover:bg-foundation"
      @click="toggleExpansion"
      @keypress="toggleExpansion"
    >
      <div class="font-bold flex items-center space-x-2">
        <BellIcon class="w-5 h-5" />
        <span>Notification preferences</span>
      </div>
      <div>
        <ChevronDownIcon
          class="w-5 h-5 transition-all duration-400"
          :class="!isExpanded && '-rotate-90'"
        />
      </div>
    </div>
    <div
      class="overflow-hidden transition-all duration-700"
      :style="`max-height: ${isExpanded ? contentHeight + 'px' : '0px'}`"
      :class="isExpanded && 'mb-3 mt-1'"
    >
      <div ref="content" class="rounded-md overflow-hidden text-sm pb-3 mt-1">
        <table class="table-auto w-full">
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
            <tr
              v-for="[type, settings] in Object.entries(localPreferences)"
              :key="type"
            >
              <td class="px-4 pb-1 pt-2">
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
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { BellIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
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

const isExpanded = ref(false)

const notificationTypeMapping = ref({
  activityDigest: 'Weekly activity digest',
  mentionedInComment: 'Mentioned in comment',
  newStreamAccessRequest: 'Stream access request',
  streamAccessRequestApproved: 'Stream access request approved'
} as Record<string, string>)

const localPreferences = ref({} as NotificationPreferences)
const content: Ref<HTMLElement | null> = ref(null)
const contentHeight = ref(0)

const notificationPreferences = computed(
  () => props.user.notificationPreferences as NotificationPreferences
)

const notificationChannels = computed(() => {
  const firstTypeSettings = Object.values(notificationPreferences.value)[0] || {}
  return Object.keys(firstTypeSettings)
})

const toggleExpansion = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    //Extra 64px needed to add vertical padding to expanded content
    contentHeight.value = (unref(content)?.scrollHeight || 0) + 64
  }
}

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
