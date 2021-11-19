<template>
  <v-dialog v-model="show" width="500" @keydown.esc="cancel" :fullscreen="$vuetify.breakpoint.smAndDown">
    <v-card>
      <v-toolbar color="primary" dark flat>
        <v-app-bar-nav-icon style="pointer-events: none">
          <v-icon>mdi-pencil</v-icon>
        </v-app-bar-nav-icon>
        <v-toolbar-title>Edit Commit</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="show = false"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>
      <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="agree">
        <v-card-text class="pl-2 pr-2 pt-0 pb-0">
          <v-container>
            <v-row>
              <v-col cols="12" class="pb-0">
                <v-text-field
                  v-model="commit.message"
                  label="Message"
                  :rules="nameRules"
                  validate-on-blur
                  required
                  autofocus
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="cancel">Cancel</v-btn>
          <v-btn :disabled="!valid" color="primary" text type="submit">Save</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  data: () => ({
    dialog: false,
    commit: {},
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
    'commit.name'(val) {
      this.nameRules = []
    }
  },
  methods: {
    open(commit, streamId) {
      this.dialog = true
      if (this.$refs.form) this.$refs.form.resetValidation()

      this.commit = {
        message: commit.message,
        id: commit.id,
        streamId: streamId
      }

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    agree() {
      this.nameRules = [
        (v) => !!v || 'Please write a commit message',
        (v) => (v && v.length >= 3) || 'Message must be at least 3 characters'
      ]

      let self = this
      setTimeout(function () {
        if (self.$refs.form.validate()) {
          self.resolve({
            result: true,
            commit: self.commit
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
