<template>
  <v-card elevation="0" rounded="lg" :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''}`">
  
    <v-toolbar :class="`${!$vuetify.theme.dark ? 'grey lighten-4' : ''} mb-2`" flat>
      <v-toolbar-title v-if="commitMessage">
        Current:
        <v-icon dense class="text-subtitle-1">mdi-source-commit</v-icon>
        {{ commitMessage }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn v-tooltip="'Clear all globals'" color="error" icon class="mr-2" @click="clearGlobals">
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <v-btn v-tooltip="'Undo any changes'" color="primary" icon class="mr-2" @click="resetGlobals">
        <v-icon>mdi-undo</v-icon>
      </v-btn>
      <v-btn
        v-tooltip="'Save your changes with a message'"
        small
        class="mr-2"
        :disabled="!canSave"
        color="primary"
        @click="
          saveDialog = true
          deleteEntries = false
        "
      >
        save
      </v-btn>
    </v-toolbar>
    <v-card-text>
      <globals-entry
        v-if="!$apollo.loading"
        :entries="globalsArray"
        :path="[]"
        :remove="deleteEntries"
        @add-prop="addProp"
        @remove-prop="removeProp"
        @field-to-object="fieldToObject"
        @object-to-field="objectToField"
      />
      <div v-else>
        <v-skeleton-loader type="list-item-three-line" />
      </div>
    </v-card-text>

    <v-dialog v-model="saveDialog" max-width="500">
      <v-card :loading="saveLoading">
        <template slot="progress">
          <v-progress-linear indeterminate></v-progress-linear>
        </template>
        <v-card-title>Save Globals</v-card-title>
        <v-form ref="form" v-model="saveValid" lazy-validation @submit.prevent="saveGlobals">
          <v-card-text>
            <v-text-field
              v-model="saveMessage"
              label="Message"
              :rules="nameRules"
              validate-on-blur
              required
              autofocus
            ></v-text-field>
          </v-card-text>
          <v-alert v-if="saveError" type="error" dismissible>
            There was a problem saving the current global variables. Computer said:
            <b>{{ saveError }}</b>
          </v-alert>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text :disabled="!saveValid" type="submit">Save</v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import gql from 'graphql-tag'
import crs from 'crypto-random-string'
import objectQuery from '../graphql/objectSingle.gql'

export default {
  name: 'GlobalsBuilder',
  components: {
    GlobalsEntry: () => import('../components/GlobalsEntry')
  },
  apollo: {
    object: {
      query: objectQuery,
      variables() {
        return {
          streamId: this.streamId,
          id: this.objectId
        }
      },
      update(data) {
        delete data.stream.object.data.__closure
        this.globalsArray = this.nestedGlobals(data.stream.object.data)
        return data.stream.object
      },
      skip() {
        return this.objectId == null
      }
    }
  },
  props: {
    userRole: {
      type: String,
      default: null
    },
    branchName: {
      type: String,
      default: null
    },
    objectId: {
      type: String,
      default: null
    },
    streamId: {
      type: String,
      default: null
    },
    commitMessage: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      globalsArray: [],
      globalsAreValid: true,
      saveDialog: false,
      deleteEntries: false,
      sample: {
        Region: 'London',
        Latitude: '0',
        Longitude: '0',
        'Project Code': 'TX-023',
        Climate: {
          'Summer DBT [C]': 35,
          'Summer WBT [C]': 20,
          'Winter DBT [C]': -4,
          'Winter WBT [C]': -4
        }
      },
      saveValid: false,
      saveLoading: false,
      nameRules: [(v) => (v && v.length >= 3) || 'Message must be at least 3 characters'],
      saveMessage: null,
      saveError: null
    }
  },
  computed: {
    canSave() {
      return (
        this.globalsAreValid &&
        (this.userRole === 'stream:contributor' || this.userRole === 'stream:owner')
      )
    },
    globalsCommit() {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      this.globalsAreValid = true
      let base = this.globalsToBase(this.globalsArray)
      return base
    }
  },
  mounted() {
    if (!this.objectId) {
      this.globalsArray = this.nestedGlobals(this.sample)
    }
  },
  methods: {
    async saveGlobals() {
      if (!this.$refs.form.validate()) return

      let commitObject = this.globalsToBase(this.globalsArray)
      
      console.log(commitObject)
      console.log(this.globalsArray)

      try {
        this.loading = true
        this.$matomo && this.$matomo.trackPageView('globals/save')
        let res = await this.$apollo.mutate({
          mutation: gql`
            mutation ObjectCreate($params: ObjectCreateInput!) {
              objectCreate(objectInput: $params)
            }
          `,
          variables: {
            params: {
              streamId: this.$route.params.streamId,
              objects: [ commitObject ]
            }
          }
        })

        await this.$apollo.mutate({
          mutation: gql`
            mutation CommitCreate($commit: CommitCreateInput!) {
              commitCreate(commit: $commit)
            }
          `,
          variables: {
            commit: {
              streamId: this.$route.params.streamId,
              branchName: 'globals',
              objectId: res.data.objectCreate[0],
              message: this.saveMessage,
              sourceApplication: 'web'
            }
          }
        })
        this.saveLoading = false
        this.saveDialog = false
      } catch (err) {
        this.saveLoading = false
        this.saveError = err
      }
    },
    nestedGlobals(data) {
      if (!data) return []
      let entries = Object.entries(data)
      let arr = []
      for (let [key, val] of entries) {
        if (key.startsWith('__')) continue
        if (['totalChildrenCount', 'speckle_type', 'id'].includes(key)) continue

        if (!Array.isArray(val) && typeof val === 'object' && val !== null) {
          if (val.speckle_type && val.speckle_type === 'reference') {
            arr.push({
              key,
              valid: true,
              id: crs({ length: 10 }),
              value: val,
              globals: this.nestedGlobals(val),
              type: 'object' //TODO: handle references
            })
          } else {
            arr.push({
              key,
              valid: true,
              id: crs({ length: 10 }),
              value: val,
              globals: this.nestedGlobals(val),
              type: 'object'
            })
          }
        } else {
          arr.push({
            key,
            valid: true,
            id: crs({ length: 10 }),
            value: val,
            type: 'field'
          })
        }
      }

      return arr
    },
    globalsToBase(arr) {
      let base = {
        // eslint-disable-next-line camelcase
        speckle_type: 'Base',
        id: null
      }

      for (let entry of arr) {

        if (!entry.value && !entry.globals) continue

        if (entry.valid !== true) {
          this.globalsAreValid = false
          return null
        }

        if (Array.isArray(entry.value)) base[entry.key] = entry.value
        else if (entry.type == 'object') {
          base[entry.key] = this.globalsToBase(entry.globals)
        } else if (typeof entry.value === 'string' && entry.value.includes(',')) {
          base[entry.key] = entry.value
            .replace(/\s/g, '')
            .split(',')
            .map((el) => (isNaN(el) ? el : parseFloat(el)))
        } else if (typeof entry.value === 'boolean') {
          base[entry.key] = entry.value
        } else {
          base[entry.key] = isNaN(entry.value) ? entry.value : parseFloat(entry.value)
        }
      }

      return base
    },
    resetGlobals() {
      this.deleteEntries = false
      this.globalsArray = this.object?.data
        ? this.nestedGlobals(this.object.data)
        : this.nestedGlobals(this.sample)
    },
    clearGlobals() {
      this.globalsArray = this.nestedGlobals({ placeholder: 'something cool goes here...' })
    },
    addProp(kwargs) {
      let globals = this.getNestedGlobals(kwargs.path)
      globals.splice(globals.length, 0, kwargs.field)
    },
    removeProp(kwargs) {
      let globals = this.getNestedGlobals(kwargs.path)
      globals.splice(kwargs.index, 1)
    },
    fieldToObject(kwargs) {
      let globals = this.getNestedGlobals(kwargs.path)

      globals.splice(kwargs.index, 1, kwargs.obj)
    },
    objectToField(kwargs) {
      let globals = this.getNestedGlobals(kwargs.path)

      globals.splice(kwargs.index, 1, ...kwargs.fields)
    },
    getNestedGlobals(path) {
      let entry = this.globalsArray
      if (!path) return entry

      let depth = path.length

      if (depth > 0) {
        let id = path.shift()
        entry = entry.find((e) => e.id == id)
      }

      if (depth > 1) {
        path.forEach((id) => {
          entry = entry.globals.find((e) => e.id == id)
        })
      }

      if (!Array.isArray(entry)) entry = entry.globals

      return entry
    },
    closeSaveDialog() {
      this.saveDialog = false
      this.$emit('new-commit')
    }
  }
}
</script>

<style scoped></style>
