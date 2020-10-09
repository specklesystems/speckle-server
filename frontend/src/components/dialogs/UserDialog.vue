<template>
  <v-dialog v-model="show" width="500" @keydown.esc="cancel">
    <v-card class="pa-4">
      <v-card-title class="subtitle-1">Edit Profile</v-card-title>

      <v-card-text class="pl-2 pr-2 pt-0 pb-0">
        <v-form ref="form" v-model="valid" lazy-validation>
          <v-container>
            <v-row>
              <v-col cols="12" class="pb-0">
                <v-text-field
                  v-model="user.name"
                  label="Name"
                  :rules="nameRules"
                  required
                  filled
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
                  filled
                  rows="2"
                  label="Bio"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn :disabled="!valid" color="primary" text @click.native="agree">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  data: () => ({
    dialog: false,
    user: {},
    nameRules: [],
    valid: true
  }),
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
  watch: {
    "user.name"(val) {
      this.nameRules = []
    }
  },
  methods: {
    open(user) {
      this.dialog = true
      if (this.$refs.form) this.$refs.form.resetValidation()

      this.user = { name: user.name, company: user.company, bio: user.bio }

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    agree() {
      this.nameRules = [
        (v) => !!v || "You need a name!",
        (v) =>
          (v && v.length <= 100) || "Name must be less than 100 characters",
        (v) => (v && v.length >= 3) || "Name must be at least 3 characters"
      ]

      let self = this
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
