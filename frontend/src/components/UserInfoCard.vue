<template>
  <v-card color="transparent" class="elevation-0 text-center">
    <div v-if="!user">
      <v-skeleton-loader type="card"></v-skeleton-loader>
    </div>
    <div v-else>
      <v-card-title class="text-center mb-5 mt-5 pt-15 pb-15">
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
            <v-card-title class="text-center">Choose a new profile picture</v-card-title>
            <v-card-text class="text-center pa-0 ma-0 mt-5">
              <v-image-input
                v-model="imageData"
                :image-quality="0.85"
                :image-height="128"
                :image-width="128"
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
        <p v-if="user.bio">
          <b>Bio:</b>
          {{ user.bio }}
        </p>
        <p v-else>This user keeps an air of mystery around themselves.</p>
        <p v-if="user.email && isSelf">
          <b>Email:</b>
          {{ user.email }}
        </p>
        <span v-if="isSelf" class="caption">Your id: {{ user.id }}</span>
      </v-card-text>
      <v-card-actions>
        <v-btn v-if="isSelf" block small @click="userDialog = true">
          Edit
          <v-icon small class="ml-3">mdi-pencil-outline</v-icon>
        </v-btn>
      </v-card-actions>
      <v-dialog v-model="userDialog" max-width="600">
        <user-dialog :user="user" @close="userDialog = false"></user-dialog>
      </v-dialog>
    </div>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'
import UserDialog from '../components/dialogs/UserDialog'
import VImageInput from 'vuetify-image-input/a-la-carte'

export default {
  components: { UserDialog, VImageInput },
  props: {
    user: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      userDialog: false,
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
        this.user.avatar = this.imageData
      } catch (e) {
        console.log(e)
      }

      this.avatarDialog = false
    }
  }
}
</script>
