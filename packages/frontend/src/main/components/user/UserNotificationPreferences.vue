<template>
  <v-card class="elevation-0 mt-3 mb-5 transparent">
    <v-card-text class="">Manage notification preferences</v-card-text>
    <v-card-text v-if="$apollo.loading">Loading...</v-card-text>
    <v-simple-table v-if="localPreferences.value">
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
            v-for="notificationType in Object.keys(localPreferences.value)"
            :key="notificationType"
          >
            <td>{{ notificationType }}</td>
            <td v-for="chanelName in notificationChannels" :key="chanelName">
              <v-checkbox
                v-model="localPreferences.value[notificationType][chanelName]"
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
import { watch, ref, defineComponent, PropType, computed, toRefs } from 'vue'
import { useApolloClient } from '@vue/apollo-composable'
import { UpdateUserNotificationPreferencesDocument } from '@/graphql/generated/graphql'
import { convertThrowIntoFetchResult } from '@/main/lib/common/apollo/helpers/apolloOperationHelper'
import { useGlobalToast } from '@/main/lib/core/composables/notifications'
import { useIsLoggedIn } from '@/main/lib/core/composables/core'

type PrefType = Record<string, Record<string, boolean>>
export default defineComponent({
  name: 'UserNotificationPreferences',
  props: {
    notificationPreferences: {
      type: Object as PropType<PrefType>,
      required: true
    }
  },
  setup(props) {
    const { client } = useApolloClient()
    const { triggerNotification } = useGlobalToast()
    const { userId } = useIsLoggedIn()
    const updatePreferences = async (preferences: PrefType) => {
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
        triggerNotification({ text: 'Notification preferences saved' })
      } else {
        const errorMessage = errors?.[0]?.message || 'Unknown error'
        triggerNotification({ text: errorMessage, type: 'error' })
      }
    }
    const localPreferences = ref<PrefType>({})
    watch(
      () => {
        props
        console.log(props)
        console.log(props.notificationPreferences)
        return props.notificationPreferences
      },
      (newValue) => {
        console.log('new value', newValue)
        if (newValue) {
          console.log('new value', newValue)
          localPreferences.value = cloneDeep(newValue)
        }
      },
      { immediate: true, deep: true }
    )
    const notificationChannels = computed(() => {
      console.log(localPreferences.value)
      const values = Object.values(localPreferences.value)
      return values.length ? Object.keys(values[0]) : []
    })
    watch(
      localPreferences,
      async (newValue, oldValue) => {
        if (!oldValue || newValue === oldValue) return
        console.log(newValue)
        await updatePreferences(newValue)
      },
      { immediate: false, deep: true }
    )
    console.log('done setup')
    return { localPreferences, notificationChannels }
  }
  // data() {
  //   return {
  //   }
  // },
  // computed: {
  //   notificationChannels() {
  //     if (!this.notificationPreferences) return
  //     const channels = Object.keys(Object.values(this.notificationPreferences)[0])
  //     return channels
  //   }
  // },
  // apollo: {
  //   user: {
  //     query: gql`
  //       query {
  //         user {
  //           id
  //           notificationPreferences
  //         }
  //       }
  //     `,
  //     result({ data }) {
  //       this.notificationPreferences = cloneDeep(data.user.notificationPreferences)
  //     }
  //   }
  // },
  // watch: {
  //   notificationPreferences(val) {
  //     console.log(this.notificationPreferences)
  //     console.log(val)
  //   }
  // }
})
</script>
