<template>
  <v-card class="elevation-0 mt-3 mb-5 transparent">
    <v-card-text>Manage notification preferences</v-card-text>
    <v-card-text v-if="$apollo.loading">Loading...</v-card-text>
    <v-simple-table v-if="localPreferences">
      <template #default>
        <thead>
          <tr>
            <th>Notification type</th>
            <th v-for="chanelName in notificationChannels" :key="chanelName">
              {{ chanelName }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="notificationType in Object.keys(localPreferences)"
            :key="notificationType"
          >
            <td>
              {{ notificationTypeMapping[notificationType] || 'unknown notification' }}
            </td>
            <td v-for="chanelName in notificationChannels" :key="chanelName">
              <v-checkbox
                v-model="localPreferences[notificationType][chanelName]"
                :disabled="updating"
              ></v-checkbox>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
  </v-card>
</template>

<script lang="ts">
import { cloneDeep } from 'lodash'
import { defineComponent } from 'vue'
import { UpdateUserNotificationPreferencesDocument } from '@/graphql/generated/graphql'
import { convertThrowIntoFetchResult } from '@/main/lib/common/apollo/helpers/apolloOperationHelper'

type PrefType = Record<string, Record<string, boolean>>
export default defineComponent({
  name: 'UserNotificationPreferences',
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      localPreferences: {} as PrefType,
      updating: false,
      notificationTypeMapping: {
        activityDigest: 'Weekly activity digest',
        mentionedInComment: 'Mentioned in comment',
        newStreamAccessRequest: 'Stream access request',
        streamAccessRequestApproved: 'Stream access request approved'
      } as Record<string, string>
    }
  },
  computed: {
    notificationChannels(): string[] {
      const values = Object.values(this.localPreferences)
      return values.length ? Object.keys(values[0]) : []
    }
  },
  mounted() {
    this.$watch(
      'user.notificationPreferences',
      (notificationPreferences) => {
        if (notificationPreferences)
          this.localPreferences = cloneDeep(notificationPreferences)
      },
      { immediate: true, deep: true }
    )
    this.$watch(
      'localPreferences',
      async (newValue, oldValue) => {
        const check = !oldValue
        if (check) return

        const client = this.$apollo.getClient()
        const userId = this.user.id
        const updatePreferences = async (preferences: PrefType) => {
          this.updating = true
          const { data, errors } = await client
            .mutate({
              mutation: UpdateUserNotificationPreferencesDocument,
              variables: { preferences },
              update: (cache, { data }) => {
                if (!data?.userNotificationPreferencesUpdate || !userId.value) return
                cache.modify({
                  id: `User:${userId.value}`,
                  fields: { notificationPreferences: () => preferences }
                })
              }
            })
            .catch(convertThrowIntoFetchResult)

          if (data?.userNotificationPreferencesUpdate) {
            this.updating = false
            this.$eventHub.$emit('notification', {
              text: 'Notification preferences saved'
            })
          } else {
            this.updating = false
            const errorMessage = errors?.[0]?.message || 'Unknown error'
            this.$eventHub.$emit('error', { text: errorMessage })
          }
        }

        await updatePreferences(newValue)
      },
      { deep: true }
    )
  }
})
</script>
