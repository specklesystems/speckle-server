<template>
  <v-dialog v-model="show" width="500" @keydown.esc="cancel">
    <v-card class="pa-4">
      <v-card-title class="subtitle-1">Edit Server Info</v-card-title>

      <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="agree">
        <v-card-text class="pl-2 pr-2 pt-0 pb-0">
          <v-container>
            <v-row>
              <v-col cols="12" class="pb-0">
                <v-text-field
                  v-model="server.name"
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
                <v-text-field v-model="server.company" filled label="Company"></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" class="pt-0 pb-0">
                <v-textarea
                  v-model="server.description"
                  filled
                  rows="2"
                  label="Description"
                ></v-textarea>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" class="pt-0 pb-0">
                <v-text-field
                  v-model="server.adminContact"
                  filled
                  label="Admin Contact"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" class="pt-0 pb-0">
                <v-text-field
                  v-model="server.termsOfService"
                  filled
                  label="Terms Of Service"
                  placeholder="https://..."
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
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
    server: {},
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
    'server.name'(val) {
      this.nameRules = []
    }
  },
  methods: {
    open(server) {
      this.dialog = true
      if (this.$refs.form) this.$refs.form.resetValidation()

      this.server = {
        name: server.name,
        company: server.company,
        description: server.description,
        termsOfService: server.termsOfService,
        adminContact: server.adminContact
      }

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    agree() {
      this.nameRules = [
        (v) => !!v || 'Servers need a name too!',
        (v) => (v && v.length <= 100) || 'Name must be less than 25 characters',
        (v) => (v && v.length >= 3) || 'Name must be at least 3 characters'
      ]

      let self = this
      setTimeout(function () {
        if (self.$refs.form.validate()) {
          self.resolve({
            result: true,
            server: self.server
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
