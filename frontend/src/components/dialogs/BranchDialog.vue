<template>
  <v-dialog v-model="show" width="500" @keydown.esc="cancel">
    <v-card class="pa-4">
      <v-card-title class="subtitle-1">
        {{ isEdit ? `Edit` : `New` }} Branch
      </v-card-title>

      <v-card-text class="pl-2 pr-2 pt-0 pb-0">
        <v-form
          ref="form"
          v-model="valid"
          lazy-validation
          @submit.prevent="agree"
        >
          <v-container>
            <v-row>
              <v-col cols="12" class="pb-0">
                <v-text-field
                  v-model="branch.name"
                  label="Name"
                  :rules="nameRules"
                  required
                  filled
                  :disabled="branch.name == 'main'"
                  autofocus
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" class="pt-0 pb-0">
                <v-textarea
                  v-model="branch.description"
                  filled
                  rows="2"
                  label="Description"
                ></v-textarea>
              </v-col>
            </v-row>
            <v-row v-if="isEdit && branch.name != 'main'">
              <v-col cols="12" class="pt-10 pb-5">
                <v-btn
                  v-if="!pendingDelete"
                  color="error"
                  block
                  outlined
                  @click="pendingDelete = true"
                >
                  Delete Branch
                </v-btn>
                <div v-if="pendingDelete">
                  <span>Delete forever?</span>
                  <v-btn
                    class="ml-5"
                    color="error"
                    depressed
                    @click.native="doDelete"
                  >
                    Yes
                  </v-btn>
                  <v-btn class="ml-5" depressed @click="pendingDelete = false">
                    No
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click.native="agree">
          {{ isEdit ? `Save` : `Create` }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  props: ["branches"],
  data() {
    return {
      dialog: false,
      branch: {},
      name: "",
      nameRules: [],
      description: "",
      valid: true,
      isEdit: false,
      pendingDelete: false
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
  watch: {
    "branch.name"(val) {
      this.nameRules = []
    }
  },
  methods: {
    open(branch, streamId) {
      //set defaults
      this.dialog = true
      this.pendingDelete = false
      this.isEdit = false
      this.branch = {}

      if (this.$refs.form) this.$refs.form.resetValidation()

      if (branch && streamId) {
        this.branch = {
          id: branch.id,
          streamId: streamId,
          name: branch.name,
          description: branch.description
        }

        this.isEdit = true
      }

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    agree() {
      //prevents annoying validation message from popping at each keystroke
      //to be used in conjunction with the watch event above and the timer function
      //source: https://stackoverflow.com/a/57555332
      this.nameRules = [
        (v) => !!v || "Branches need a name too!",
        (v) =>
          (v &&
            this.branches.filter((e) => e.name === v && e.id !== this.branch.id)
              .length === 0) ||
          "A branch with this name already exists",
        (v) => (v && v.length <= 25) || "Name must be less than 25 characters",
        (v) => (v && v.length >= 3) || "Name must be at least 3 characters"
      ]

      let self = this
      setTimeout(function () {
        if (self.$refs.form.validate()) {
          self.resolve({
            result: true,
            branch: self.branch
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
