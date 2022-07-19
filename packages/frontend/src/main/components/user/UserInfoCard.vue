<template>
  <div>
    <div v-if="!user">
      <v-skeleton-loader type="card"></v-skeleton-loader>
    </div>
    <section-card v-if="user">
      <template #header>
        <span v-if="isSelf">Hi</span>
        &nbsp;
        <b>{{ user.name }}</b>
        <span v-if="isSelf">!</span>
        <v-icon
          v-if="user.verified"
          v-tooltip="'Verfied email'"
          small
          class="ml-3 primary--text"
        >
          mdi-shield-check
        </v-icon>
        <v-icon
          v-else
          v-tooltip="'Email not verified'"
          small
          class="mr-2 warning--text"
        >
          mdi-shield-alert
        </v-icon>
      </template>
      <template #actions>
        <v-spacer />
        <v-btn v-if="isSelf" color="primary" @click="editUser">
          <v-icon small class="mr-2">mdi-pencil</v-icon>
          Edit
        </v-btn>
      </template>
      <v-card-text>
        <v-row class="pa-4 align-center d-flex">
          <v-col cols="12" sm="8">
            <p>
              <b>Company:</b>
              {{ user.company ? user.company : 'No info provided.' }}
            </p>
            <p v-if="user.email && isSelf">
              <b>Email:</b>
              {{ user.email }}
            </p>
            <p>
              <b>Bio:</b>
              {{ user.bio ? user.bio : 'No bio provided.' }}
            </p>
            <p>
              <v-tooltip top z-index="101">
                <template #activator="{ on, attrs }">
                  <span v-bind="attrs" v-on="on">
                    {{ user.totalOwnedStreamsFavorites || 0 }}
                    <v-icon color="red darken-3">mdi-heart</v-icon>
                  </span>
                </template>
                <span>
                  Total amount of favorites for all streams owned by this user
                </span>
              </v-tooltip>
            </p>
            <span v-if="isSelf" class="caption">
              id:
              <code>{{ user.id }}</code>
              , suuid:
              <code>{{ user.suuid }}</code>
            </span>
            <br />
          </v-col>
          <v-col cols="12" sm="4" class="d-flex justify-center">
            <div @click="avatarDialog = isSelf ? true : false">
              <user-avatar-icon
                v-tooltip="`${isSelf ? 'Change your profile picture' : ''}`"
                :style="`${isSelf ? 'cursor: pointer;' : ''}`"
                :size="100"
                :avatar="user.avatar"
                :seed="user.id"
              ></user-avatar-icon>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </section-card>
    <user-edit-dialog ref="userDialog" :user="user"></user-edit-dialog>
    <v-dialog v-model="avatarDialog" max-width="400">
      <v-card>
        <v-card-title>Choose a new profile picture</v-card-title>
        <v-card-text class="pl-10 pr-0 mt-5">
          <v-image-input
            v-model="imageData"
            :image-quality="0.85"
            :image-height="256"
            :image-width="256"
            full-width
            full-height
            clearable
            image-format="jpeg"
          />
        </v-card-text>
        <v-card-actions>
          <span v-if="imageData" class="caption">You look wonderful!</span>
          <v-spacer></v-spacer>
          <v-btn text @click="avatarDialog = false">cancel</v-btn>
          <v-btn :disabled="!imageData" @click="updateAvatar">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import { gql } from '@apollo/client/core'
export default {
  components: {
    VImageInput: () => import('vuetify-image-input/a-la-carte'),
    UserAvatarIcon: () => import('@/main/components/common/UserAvatarIcon'),
    SectionCard: () => import('@/main/components/common/SectionCard'),
    UserEditDialog: () => import('@/main/dialogs/UserEditDialog')
  },
  props: {
    user: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      avatarDialog: false,
      imageData: null
    }
  },
  computed: {
    isSelf() {
      if (!this.user) return false
      return this.user.id === localStorage.getItem('uuid')
    }
  },
  methods: {
    async updateAvatar() {
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation userUpdate($update: UserUpdateInput!) {
              userUpdate(user: $update)
            }
          `,
          variables: {
            update: {
              avatar: this.imageData
            }
          }
        })
        this.$emit('update')
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: e.message
        })
      }

      this.avatarDialog = false
    },
    //using vue dialogs just like .net modals
    async editUser() {
      this.$refs.userDialog.open(this.user).then((dialog) => {
        if (!dialog.result) return

        this.$mixpanel.track('User Action', { type: 'action', name: 'update' })

        this.isLoading = true
        this.$apollo
          .mutate({
            mutation: gql`
              mutation userUpdate($myUser: UserUpdateInput!) {
                userUpdate(user: $myUser)
              }
            `,
            variables: {
              myUser: {
                name: dialog.user.name,
                bio: dialog.user.bio,
                company: dialog.user.company
              }
            }
          })
          .then(() => {
            this.isLoading = false
            this.$emit('update')
          })
      })
    }
  }
}
</script>
