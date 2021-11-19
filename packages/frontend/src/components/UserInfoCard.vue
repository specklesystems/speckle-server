<template>
  <div>
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

    <div v-if="!user">
      <v-skeleton-loader type="card"></v-skeleton-loader>
    </div>

    <v-card
      v-else
      class="elevation-0"
      rounded="lg"
      :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''}`"
    >
      <v-toolbar flat :class="`${!$vuetify.theme.dark ? 'grey lighten-4' : ''}`">
        <v-toolbar-title>
          <span v-if="isSelf">Hi</span>
          {{ user.name }}
          <span v-if="isSelf">!</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn v-if="isSelf" small rounded color="primary" @click="editUser">
          <v-icon small class="mr-2">mdi-cog-outline</v-icon>
          Edit
        </v-btn>
      </v-toolbar>
      <v-row class="pa-4" align="stretch">
        <v-col cols="12" sm="8">
          <p v-if="user.company" class="subtitle-1">Company: {{ user.company }}</p>
          <p v-if="user.email && isSelf">Email: {{ user.email }}</p>
          <p v-if="user.bio">Bio: {{ user.bio }}</p>
          <p v-else>This user keeps an air of mystery around themselves.</p>

          <span v-if="isSelf" class="caption">ID: {{ user.id }}</span>
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
      <v-card-actions></v-card-actions>

      <user-edit-dialog ref="userDialog" :user="user"></user-edit-dialog>
    </v-card>
  </div>
</template>
<script>
import gql from 'graphql-tag'
import UserEditDialog from '../components/dialogs/UserEditDialog'
import VImageInput from 'vuetify-image-input/a-la-carte'
import UserAvatarIcon from '@/components/UserAvatarIcon'

export default {
  components: { UserAvatarIcon, UserEditDialog, VImageInput },
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
        console.log(e)
      }

      this.avatarDialog = false
    },
    //using vue dialogs just like .net modals
    async editUser() {
      this.$refs.userDialog.open(this.user).then((dialog) => {
        if (!dialog.result) return

        this.$matomo && this.$matomo.trackPageView('user/update')

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
