<template>
  <v-dialog v-model="show" width="500" @keydown.esc="cancel">
    <v-card class="pa-4">
      <v-card-title class="subtitle-1">New Stream</v-card-title>

      <v-card-text class="pl-2 pr-2 pt-0 pb-0">
        <v-form ref="form" v-model="valid" lazy-validation>
          <v-container>
            <v-row>
              <v-col cols="12" class="pb-0">
                <v-text-field
                  v-model="name"
                  label="Name"
                  :rules="nameRules"
                  required
                  filled
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" class="pt-0 pb-0">
                <v-textarea
                  v-model="description"
                  filled
                  rows="2"
                  label="Description"
                ></v-textarea>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" class="pt-0 pb-0">
                <v-switch
                  v-model="isPublic"
                  :label="`Link sharing ` + (isPublic ? `on` : `off`)"
                ></v-switch>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn :disabled="!valid" color="primary" text @click.native="agree">
          Create
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  data: () => ({
    dialog: false,
    name: "",
    nameRules: [],
    description: "",
    isPublic: true,
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
    name(val) {
      this.nameRules = []
    }
  },
  methods: {
    open() {
      this.dialog = true
      if (this.$refs.form) this.$refs.form.reset()
      this.isPublic = true // set to true by default

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    agree() {
      this.nameRules = [
        (v) => !!v || "Streams need a name too!",
        (v) => (v && v.length <= 25) || "Name must be less than 25 characters",
        (v) => (v && v.length >= 3) || "Name must be at least 3 characters"
      ]

      if (!this.$refs.form.validate()) return

      let self = this
      setTimeout(function () {
        if (self.$refs.form.validate()) {
          self.resolve({
            result: true,
            name: self.name,
            description: self.description,
            isPublic: self.isPublic
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
