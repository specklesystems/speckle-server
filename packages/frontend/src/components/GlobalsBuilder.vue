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
      <v-btn v-tooltip="'Undo any changes'" color="primary" small @click="resetGlobals">
        reset all
      </v-btn>
      <v-btn
        v-if="userRole === 'contributor' || userRole === 'owner'"
        v-tooltip="'Save your changes with a message'"
        small
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
      <v-card-text>
        These global variables can be used for storing design values, project requirements, notes,
        or any info you want to keep track of alongside your geometry. These values can be text,
        numbers, lists, or booleans. Click the box icon next to any field to turn it into a nested
        group of fields. You can drag and drop fields in and out of groups as you please. Note that
        field order may not always be preserved.
      </v-card-text>
      <v-card-text v-if="!(userRole === 'contributor') && !(userRole === 'owner')">
        You are free to play around with the globals here, but you do not have the required stream
        permission to save your changes.
      </v-card-text>
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
          id: this.newObjectHash ?? this.objectId
        }
      },
      update(data) {
        delete data.stream.object.data.__closure
        this.globalsArray = this.nestedGlobals(data.stream.object.data)
        return data.stream.object
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
    }
  },
  data() {
    return {
      globalsArray: [],
      newObjectHash: null,
      saveDialog: false,
      deleteEntries: false
    }
  },
  computed: {
    globalsCommit() {
      let base = this.globalsToBase(this.globalsArray)
      return base
    },
    validObject() {
      return this.checkValidKeys(this.globalsArray)
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
              value: val,
              globals: this.nestedGlobals(val),
              type: 'object', //TODO: handle references
              isValid: true
            })
          } else {
            arr.push({
              key,
              value: val,
              globals: this.nestedGlobals(val),
              type: 'object',
              isValid: true
            })
          }
        } else {
          arr.push({
            key,
            value: val,
            type: 'field',
            isValid: true
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
      arr.forEach((entry) => {
        if (!entry.value && !entry.globals) return

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
      })
      return base
    },
    resetGlobals() {
      if (!this.object.data) return

      this.deleteEntries = false
      this.globalsArray = this.nestedGlobals(this.object.data)
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
        let key = path.shift()
        entry = entry.find((e) => e.key == key)
      }

      if (depth > 1) {
        path.forEach((key) => {
          entry = entry.globals.find((e) => e.key == key)
        })
      }

      if (!Array.isArray(entry)) entry = entry.globals

      return entry
    },
    closeSaveDialog(hash) {
      this.newObjectHash = hash
      this.saveDialog = false
      this.$apollo.queries.object.refetch()
    },
    checkValidKeys(arr) {
      if (!arr) return false
      let valid = true
      arr.forEach((o) => {
        if (o.type == 'object') {
          valid = this.checkValidKeys(o.globals)
        }

        if (!valid) return false

        if (!o.isValid) return false
      })

      return true
    }
  }
}
</script>

<style scoped></style>
