<template>
  <v-card rounded="lg" class="pa-3 mb-3" elevation="0">
    <v-dialog v-model="saveDialog" max-width="500">
      <globals-save-dialog
        :branch-name="branchName"
        :stream-id="$route.params.streamId"
        :commit-obj="globalsCommit"
        @close="closeSaveDialog"
      />
    </v-dialog>
    <v-card-title>Globals</v-card-title>
    <v-card-subtitle v-if="commitMessage">
      <v-icon dense class="text-subtitle-1">mdi-source-commit</v-icon>
      {{ commitMessage }}
    </v-card-subtitle>
    <v-card-text>
      These global variables can be used for storing design values, project requirements, notes, or
      any info you want to keep track of alongside your geometry. Variable values can be text,
      numbers, lists, or booleans. Click the box icon next to any field to turn it into a nested
      group of fields, and drag and drop fields in and out of groups as you please! Note that field
      order may not always be preserved.
    </v-card-text>
    <v-card-text v-if="!(userRole === 'contributor') && !(userRole === 'owner')">
      You are free to play around with the globals here, but you do not have the required stream
      permission to save your changes.
    </v-card-text>
    <v-card-actions>
      <v-switch
        v-model="deleteEntries"
        v-tooltip="'Toggle delete mode'"
        class="ml-3"
        dense
        inset
        color="error"
        :label="`DELETE`"
      ></v-switch>
      <v-spacer />
      <v-btn v-tooltip="'Clear all globals'" color="primary" small @click="clearGlobals">
        clear
      </v-btn>
      <v-btn v-tooltip="'Undo any changes'" color="primary" small @click="resetGlobals">
        reset all
      </v-btn>
      <v-btn
        v-if="userRole === 'contributor' || userRole === 'owner'"
        v-tooltip="'Save your changes with a message'"
        small
        :disabled="!globalsAreValid"
        color="primary"
        @click="
          saveDialog = true
          deleteEntries = false
        "
      >
        save
      </v-btn>
    </v-card-actions>
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
  </v-card>
</template>

<script>
import crs from 'crypto-random-string'
import objectQuery from '../graphql/objectSingle.gql'

export default {
  name: 'GlobalsBuilder',
  components: {
    GlobalsEntry: () => import('../components/GlobalsEntry'),
    GlobalsSaveDialog: () => import('../components/dialogs/GlobalsSaveDialog')
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
        'Project Code': 'GB123456',
        'Linked Projects': ['GB654321', 'EU424242'],
        'Project Lead': 'Sir Spockle II',
        'Pretty Cool?': true,
        Climate: {
          'Summer DBT [C]': 35,
          'Summer WBT [C]': 20,
          'Winter DBT [C]': -4,
          'Winter WBT [C]': -4,
          Enthalpy: {
            'Summer Enthalpy [kJ per kg]': 56.87,
            'Winter Enthalpy [kJ per kg]': 2.74
          }
        }
      }
    }
  },
  computed: {
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
        if (!entry.value && !entry.globals) return

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
