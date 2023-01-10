<template>
  <div style="display: inline-block">
    <v-menu v-if="isLoggedIn" offset-x open-on-hover :close-on-content-click="false">
      <template #activator="{ on, attrs }">
        <div v-bind="attrs" v-on="on">
          <user-avatar-icon
            v-if="userById"
            :size="size"
            :avatar="userById.avatar"
            :seed="id"
            v-bind="attrs"
            :class="`${margin ? 'ma-1' : ''} ${shadow ? 'elevation-5' : ''}`"
          ></user-avatar-icon>
          <v-avatar
            v-else
            :class="`${margin ? 'ma-1' : ''} ${shadow ? 'elevation-5' : ''}`"
            :size="size"
          >
            <v-img contain src="/logo.svg"></v-img>
          </v-avatar>
        </div>
      </template>
      <v-card v-if="userById && showHover" style="width: 200px">
        <v-card-text v-if="!$apollo.loading">
          <div>
            <b>
              {{ userById.name }}
              <v-icon
                v-if="userById.verified"
                v-tooltip="'Verfied email'"
                x-small
                class="mr-2 primary--text"
              >
                mdi-shield-check
              </v-icon>
            </b>
          </div>
          <div class="caption mt-2">
            <div>
              <v-icon x-small>mdi-domain</v-icon>
              {{ userById.company ? userById.company : 'No company info.' }}
            </div>
            <div v-if="userById.bio" class="text-truncate">
              <v-icon x-small>mdi-information-outline</v-icon>
              {{ userById.bio }}
            </div>
          </div>
          <div class="mt-2">
            <v-btn x-small block :to="isSelf ? '/profile' : '/profile/' + id">
              View profile
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
      <v-card v-else-if="showHover">
        <v-card-text class="text-xs">
          <b>Speckle Ghost</b>
          <br />
          This user no longer exists.
        </v-card-text>
      </v-card>
    </v-menu>
    <user-avatar-icon
      v-else
      :class="`${margin ? 'ma-1' : ''} ${shadow ? 'elevation-5' : ''}`"
      :size="size"
      :avatar="avatar"
      :seed="id"
    ></user-avatar-icon>
  </div>
</template>
<script lang="ts">
import UserAvatarIcon from '@/main/components/common/UserAvatarIcon.vue'
import { AppLocalStorage } from '@/utils/localStorage'
import { LocalStorageKeys } from '@/helpers/mainConstants'
import { useIsLoggedIn } from '@/main/lib/core/composables/core'
import { computed, defineComponent, PropType } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { UserByIdDocument } from '@/graphql/generated/graphql'
import { MaybeNullOrUndefined } from '@/helpers/typeHelpers'

export default defineComponent({
  components: { UserAvatarIcon },
  props: {
    avatar: {
      type: String as PropType<MaybeNullOrUndefined<string>>,
      default: null
    },
    name: {
      type: String as PropType<MaybeNullOrUndefined<string>>,
      default: null
    },
    showHover: {
      type: Boolean,
      default: true
    },
    shadow: {
      type: Boolean,
      default: false
    },
    margin: {
      type: Boolean,
      default: true
    },
    size: {
      type: Number,
      default: 42
    },
    id: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const { isLoggedIn } = useIsLoggedIn()
    const { result: userByIdResult } = useQuery(
      UserByIdDocument,
      () => ({ id: props.id }),
      () => ({ enabled: isLoggedIn.value })
    )
    const userById = computed(() => userByIdResult.value?.otherUser)

    return { isLoggedIn, userById }
  },
  computed: {
    isSelf(): boolean {
      return this.id === AppLocalStorage.get(LocalStorageKeys.Uuid)
    }
  }
})
</script>
