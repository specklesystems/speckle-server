<template>
  <v-dialog v-model="show" width="500" @keydown.esc="cancel">
    <v-card v-if="correctEmail" class="">
      <v-toolbar color="error" dark flat>
        <v-app-bar-nav-icon style="pointer-events: none">
          <v-icon>mdi-delete</v-icon>
        </v-app-bar-nav-icon>
        <v-toolbar-title>Delete Account?</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="show = false"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>
      <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="agree">
        <v-card-text class="pl-2 pr-2 pt-0 pb-0">
          <v-container>
            <v-row>
              <v-col cols="12" class="pb-0">
                <p>
                  To protect against accidental deletion, please enter the email address
                  associated with this account:
                </p>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" class="pb-0">
                <v-text-field
                  v-model="email"
                  label="Email:"
                  :rules="emailRules"
                  validate-on-blur
                  required
                  filled
                  autofocus
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="cancel">Cancel</v-btn>
          <v-btn color="error" :disabled="!valid" type="submit">
            Delete my account
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  data() {
    return {
      correctEmail: null,
      email: null,
      dialog: false,
      isLoading: false,
      emailRules: [(v) => v === this.correctEmail || 'Incorrect email'],
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
      this.correctEmail = user.email
      this.email = ''

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
            email: self.email
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
