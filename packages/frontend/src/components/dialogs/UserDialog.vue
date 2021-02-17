<template>
  <v-card class="pa-4" color="background2">
    <v-card-title class="subtitle-1">Edit Profile</v-card-title>
    <v-card-text class="pl-2 pr-2 pt-0 pb-0">
      <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="agree">
        <v-container>
          <v-row>
            <v-col cols="12" class="pb-0">
              <v-text-field
                v-model="name"
                label="Name"
                :rules="nameRules"
                required
                filled
                autofocus
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" class="pt-0 pb-0">
              <v-text-field v-model="company" filled label="Company"></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" class="pt-0 pb-0">
              <v-textarea v-model="bio" :rules="bioRules" filled rows="2" label="Bio"></v-textarea>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text @click="$emit('close')">cancel</v-btn>
      <v-btn :disabled="!valid" :loading="isLoading" @click.native="updateUser">Save</v-btn>
    </v-card-actions>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'

export default {
  props: {
    user: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      dialog: false,
      isLoading: false,
      name: this.user.name,
      bio: this.user.bio,
      company: this.user.company,
      nameRules: [
        (v) => !!v || 'Name is required',
        (v) => (v && v.length <= 60) || 'Name must be less than 60 characters.'
      ],
      bioRules: [(v) => (v && v.length <= 500) || 'Bio must be less than 500 characters.'],
      valid: true
    }
  },
  computed: {},
  watch: {},
  methods: {
    async updateUser() {
      this.$matomo && this.$matomo.trackPageView('user/update')
      try {
        this.isLoading = true
        await this.$apollo.mutate({
          mutation: gql`
            mutation userUpdate($myUser: UserUpdateInput!) {
              userUpdate(user: $myUser)
            }
          `,
          variables: {
            myUser: {
              name: this.name,
              bio: this.bio,
              company: this.company
            }
          }
        })
        this.isLoading = false
        this.$emit('close')
      } catch (e) {
        // TODO: log
        console.log(e)
      }
    }
  }
}
</script>
