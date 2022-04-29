<template>
  <v-container>
    <draggable
      :list="entries"
      class="dragArea pl-0"
      tag="ul"
      group="globals"
      v-bind="dragOptions"
      handle=".drag-handle"
      @start="drag = true"
      @end="drag = false"
    >
      <div v-for="(entry, index) in entries" :key="entry.id">
        <transition type="transition" :name="!drag ? 'flip-list' : null">
          <div v-if="!entry.globals">
            <div class="d-flex align-center">
              <v-icon color="grey darken-1" class="mb-2 mr-2 drag-handle">
                mdi-menu
              </v-icon>
              <v-text-field
                ref="keyInput"
                v-model="entry.key"
                :rules="rules.keys(index, entries)"
                :error-messages="entry.valid === true ? null : entry.valid"
                class="entry-key mr-5"
                hint="property name"
                filled
                dense
                rounded
              />
              <v-text-field
                v-model="entry.value"
                class="entry-value mr-5"
                hint="property value"
              />
              <v-btn
                v-if="true"
                v-tooltip="'Transform this field into a nested object'"
                icon
                small
                @click="emitFieldToObject(entry, index)"
              >
                <v-icon small color="primary">mdi-cube-outline</v-icon>
              </v-btn>
              <v-btn
                v-if="true"
                v-tooltip="'Remove this entry'"
                icon
                rounded
                x-small
                color="error"
                style="margin-left: 3px"
                @click="emitRemoveAt(index)"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
          <v-card v-else rounded="lg" class="my-2" elevation="4">
            <v-toolbar dense flat>
              <v-toolbar-title
                v-if="!editTitle"
                @mouseenter="mouseOver = true"
                @mouseleave="mouseOver = false"
                @click="editTitle = true"
              >
                {{ entry.key }}
                <v-btn
                  v-show="mouseOver"
                  icon
                  small
                  color="primary"
                  @click="editTitle = true"
                >
                  <v-icon small>mdi-pencil</v-icon>
                </v-btn>
              </v-toolbar-title>
              <v-toolbar-title v-else>
                <v-text-field
                  ref="keyInput"
                  v-model="entry.key"
                  :rules="rules.keys(index, entries)"
                  :error-messages="entry.valid === true ? null : entry.valid"
                  append-icon="mdi-check"
                  style="width: 300px; margin-top: 14px"
                  @click:append="editTitle = false"
                  @keyup.enter="editTitle = false"
                ></v-text-field>
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <v-toolbar-items>
                <v-btn
                  v-tooltip="'Flatten this object into fields'"
                  class="mr-3"
                  icon
                  small
                  @click="emitObjectToField(entry, index)"
                >
                  <v-icon small color="primary">mdi-arrow-collapse-down</v-icon>
                </v-btn>
                <v-btn
                  v-if="true"
                  v-tooltip="'Remove this entry'"
                  icon
                  rounded
                  x-small
                  color="error"
                  style="margin-left: 3px"
                  @click="emitRemoveAt(index)"
                >
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-toolbar-items>
            </v-toolbar>
            <globals-entry
              :entries="entry.globals"
              :path="[...path, entry.id]"
              :remove="remove"
              v-on="$listeners"
            />
          </v-card>
        </transition>
      </div>
    </draggable>
    <div
      v-if="!remove"
      slot="footer"
      key="footer"
      class="btn-group list-group-item mt-3"
      role="group"
      aria-label="Basic example"
    >
      <v-btn
        v-tooltip="'Add a new field to this object'"
        color="primary"
        rounded
        fab
        small
        @click="emitAddProp"
      >
        <v-icon small>mdi-plus</v-icon>
      </v-btn>
    </div>
  </v-container>
</template>
<script>
import draggable from 'vuedraggable'
import { randomString } from '@/helpers/randomHelpers'

export default {
  name: 'GlobalsEntry',
  components: { draggable },
  props: {
    entries: {
      type: Array,
      default: null
    },
    path: {
      type: Array,
      default: null
    },
    streamId: {
      type: String,
      default: null
    },
    remove: {
      type: Boolean,
      default: false
    },
    invalidIds: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      editTitle: false,
      mouseOver: false,
      drag: false,
      valid: true,
      rules: {
        keys(index, entries) {
          return [
            (v) => {
              const result = !!v || 'Properties need to have a name!'
              entries[index].valid = result
              return result
            },
            (v) => {
              const filtered = entries.filter((_, i) => i !== index)
              const result =
                filtered.findIndex((e) => e.key === v) === -1 ||
                'Each property name must be unique'
              if (entries[index].valid === true) entries[index].valid = result
              return result
            },
            (v) => {
              const re = /[./]/
              const result =
                !re.test(v) || 'The name cannot contain invalid characters: "." or "/"'
              if (entries[index].valid === true) entries[index].valid = result
              return result
            }
          ]
        }
      },
      errors: []
    }
  },
  computed: {
    dragOptions() {
      return {
        animation: 150,
        disabled: false,
        ghostClass: 'ghost'
      }
    }
  },
  methods: {
    emitAddProp() {
      const bimNouns = [
        'parameter',
        'BIM',
        'triple O',
        'digital twin',
        'LOD 9000',
        'automation',
        'structure',
        'layer',
        'interop'
      ]
      const bimAdjs = [
        'parametric',
        'chonky',
        '3D',
        'liminal',
        'brutalist',
        'postmodern',
        'discrete',
        'dank'
      ]
      const bimExclamations = ['wow', 'much', 'yes', 'towards a new']
      const randomPhrase =
        bimExclamations[Math.floor(Math.random() * bimExclamations.length)] +
        ' ' +
        bimAdjs[Math.floor(Math.random() * bimAdjs.length)] +
        ' ' +
        bimNouns[Math.floor(Math.random() * bimNouns.length)]
      const field = {
        key: `placeholder ${randomString(6)}`,
        type: 'field',
        value: randomPhrase,
        valid: true,
        id: randomString(10)
      }
      this.$emit('add-prop', { field, path: this.path })
    },
    emitRemoveAt(index) {
      this.$emit('remove-prop', { path: this.path, index })
    },
    emitFieldToObject(entry, index) {
      const obj = {
        key: entry.key,
        type: 'object',
        id: entry.id,
        valid: entry.valid,
        globals: [
          {
            key: `placeholder ${randomString(6)}`,
            type: 'field',
            value: entry.value,
            id: randomString(10),
            valid: true
          }
        ]
      }
      this.$emit('field-to-object', { obj, path: this.path, index })
    },
    emitObjectToField(entry, index) {
      const fields = entry.globals
      this.$emit('object-to-field', { fields, path: this.path, index })
    }
  }
}
</script>
<style scoped>
.v-card {
  background-color: rgba(0, 0, 0, 0.1);
}

.v-card__title {
  font-weight: 500;
  font-size: large;
}

.v-text-field {
  font-weight: 300;
}

.entry-key {
  font-weight: 500;
  position: relative;
  top: 0.6rem;
}

.entry-delete {
  position: relative;
  top: -0.2rem;
}

.dragArea {
  min-height: 50px;
}

.ghost {
  opacity: 0.5;
}

.flip-list-move {
  transition: transform 0.5s;
}
</style>
