<template>
  <v-dialog v-model="show" width="500" @keydown.esc="cancel">
    <v-card v-if="user">
      <v-toolbar color="primary" dark flat>
        <v-app-bar-nav-icon style="pointer-events: none">
          <v-icon>mdi-account</v-icon>
        </v-app-bar-nav-icon>
        <v-toolbar-title>Edit Profile</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="show = false"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>
      <v-card-title class="subtitle-1">Edit Profile</v-card-title>
      <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="agree">
        <v-card-text class="pl-2 pr-2 pt-0 pb-0">
          <v-container>
            <v-row>
              <v-col cols="12" class="pb-0">
                <v-text-field
                  v-model="user.name"
                  label="Name"
                  :rules="nameRules"
                  validate-on-blur
                  required
                  filled
                  autofocus
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" class="pt-0 pb-0">
                <v-text-field
                  v-model="user.company"
                  filled
                  label="Company"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" class="pt-0 pb-0">
                <v-textarea
                  v-model="user.bio"
                  :rules="bioRules"
                  filled
                  rows="2"
                  label="Bio"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="cancel">Cancel</v-btn>
          <v-btn color="primary" text :disabled="!valid" type="submit">Save</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  data() {
    return {
      user: null,
      dialog: false,
      isLoading: false,
      nameRules: [
        (v) => !!v || 'Name is required',
        (v) => (v && v.length <= 60) || 'Name must be less than 60 characters.'
      ],
      bioRules: [
        (v) => !v || (v && v.length <= 500) || 'Bio must be less than 500 characters.'
      ],
      valid: true
    }
  },
  computed: {
    show: {
      get() {
        return this.dialog
      },
      set(value) {
        this.dialog = value
        if (value === false) {
          this.cancel()
        }
      }
    }
  },
  watch: {},
  methods: {
    //using vue dialogs just like .net modals
    open(user) {
      this.dialog = true
      if (this.$refs.form) this.$refs.form.resetValidation()
      this.user = {
        name: user.name,
        bio: user.bio,
        company: user.company
      }

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    agree() {
      const self = this
      setTimeout(function () {
        if (self.$refs.form.validate()) {
          self.resolve({
            result: true,
            user: self.user
          })
          self.dialog = false
        }
      })
    },
    cancel() {
      this.resolve({
        result: false
      })
      this.dialog = false
    }
  }
}
</script>
