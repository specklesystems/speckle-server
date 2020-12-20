<template>
  <v-dialog v-model="show" width="500" @keydown.esc="cancel">
    <v-card class="pa-4" color="background2">
      <v-card-title class="subtitle-1">{{ isEdit ? `Edit` : `New` }} Stream</v-card-title>
      <v-card-text class="pl-2 pr-2 pt-0 pb-0">
        <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="agree">
          <v-container>
            <v-row>
              <v-col cols="12" class="pb-0">
                <v-text-field
                  v-model="stream.name"
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
                <v-switch
                  v-model="stream.isPublic"
                  :label="`Link sharing ` + (stream.isPublic ? `on` : `off` + ` (not working)`)"
                ></v-switch>
              </v-col>
            </v-row>
            <v-row v-if="isEdit" align="center">
              <v-col cols="12" class="pt-2 pb-2">
                <div v-if="!pendingDelete">
                  <v-btn color="error" depressed class="mt-5" @click="pendingDelete = true">
                    Delete Stream
                  </v-btn>
                  <p class="ml-4 mt-0 pt-0 caption" style="display: inline-flex; width: 250px">
                    Delete this stream forever, no going back here!
                  </p>
                </div>

                <div v-if="pendingDelete">
                  <v-btn color="error" depressed @click.native="doDelete">Yes</v-btn>
                  <v-btn class="ml-5" depressed @click="pendingDelete = false">No</v-btn>
                  <p class="ml-4 mt-0 pt-0 caption" style="display: inline-flex; width: 150px">
                    Are you sure?
                  </p>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn :disabled="!valid" color="primary" text @click.native="agree">
          {{ isEdit ? `Save` : `Create` }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  data: () => ({
    dialog: false,
    stream: { isPublic: true },
    nameRules: [],
    valid: true,
    isEdit: false,
    pendingDelete: false
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
    'stream.name'(val) {
      this.nameRules = []
    }
  },
  methods: {
    open(stream) {
      //set defaults
      this.dialog = true
      this.pendingDelete = false
      this.isEdit = false
      this.stream = { isPublic: true }

      if (this.$refs.form) this.$refs.form.resetValidation()

      if (stream) {
        this.stream = {
          id: stream.id,
          name: stream.name,
          description: stream.description,
          isPublic: stream.isPublic
        }

        this.isEdit = true
      }

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    agree() {
      this.nameRules = [
        (v) => !!v || 'Streams need a name too!',
        (v) => (v && v.length <= 150) || 'Name must be less than 150 characters',
        (v) => (v && v.length >= 3) || 'Name must be at least 3 characters'
      ]

      let self = this
      setTimeout(function () {
        if (self.$refs.form.validate()) {
          self.resolve({
            result: true,
            stream: self.stream
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
    },

    doDelete() {
      this.resolve({
        result: true,
        delete: true
      })
      this.dialog = false
    }
  }
}
</script>
