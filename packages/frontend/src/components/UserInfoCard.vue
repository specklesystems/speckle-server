<template>
  <div>
    <div v-if="!user">
      <v-skeleton-loader type="card"></v-skeleton-loader>
    </div>

    <v-card v-else color="transparent" class="elevation-0 text-center">
      <v-card-title class="text-center mb-5 mt-5 pt-15 pb-10">
        <v-btn
          v-tooltip="'Change your profile picture.'"
          color="transparent"
          text
          block
          :disabled="!isSelf"
          class="elevation-0 pa-0 ma-0"
        >
          <v-avatar class="elevation-0" size="100" @click="avatarDialog = true">
            <v-img v-if="user.avatar" :src="user.avatar" />
            <v-img v-else :src="`https://robohash.org/` + user.id + `.png?size=64x64`" />
          </v-avatar>
        </v-btn>
        <v-dialog v-model="avatarDialog" max-width="400">
          <v-card>
            <v-card-title>Choose a new profile picture</v-card-title>
            <v-card-text class="pa-0 ma-0 mt-5">
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
      </v-card-title>
      <v-card-title class="text-center justify-center">
        {{ user.name }}
      </v-card-title>
      <v-card-text>
        <p v-if="user.company" class="subtitle-1">{{ user.company }}</p>
        <p v-if="user.email && isSelf">
          {{ user.email }}
        </p>
        <p v-if="user.bio">
          {{ user.bio }}
        </p>
        <p v-else>This user keeps an air of mystery around themselves.</p>

        <span v-if="isSelf" class="caption">ID: {{ user.id }}</span>
      </v-card-text>

      <v-card-actions>
        <v-btn v-if="isSelf" small plain color="primary" text block @click="editUser">
          <v-icon small class="mr-2">mdi-cog-outline</v-icon>
          Edit
        </v-btn>
      </v-card-actions>

      <user-edit-dialog ref="userDialog" :user="user"></user-edit-dialog>
    </v-card>
  </div>
</template>
<script>
import gql from 'graphql-tag'
import UserEditDialog from '../components/dialogs/UserEditDialog'
import VImageInput from 'vuetify-image-input/a-la-carte'

export default {
  components: { UserEditDialog, VImageInput },
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
