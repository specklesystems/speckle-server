<template>
  <v-container>
    <draggable
      :list="entries"
      class="dragArea"
      tag="ul"
      group="globals"
      v-bind="dragOptions"
      @start="drag = true"
      @end="drag = false"
    >
      <div v-for="(entry, index) in entries" :key="entry.key">
        <transition type="transition" :name="!drag ? 'flip-list' : null">
          <div v-if="!entry.globals">
            <div class="d-flex align-center" @mouseover="hoverEffect">
              <v-btn v-if="remove" class="entry-delete mr-5" fab rounded x-small color="error" @click="emitRemoveAt(index)">
                <v-icon>mdi-minus</v-icon>
              </v-btn>
              <v-text-field
                  ref="keyInput"
                  :value="entry.key"
                  :rules="rules.keys(index, entries)"
                  class="entry-key mr-5"
                  hint="property name"
                  filled
                  dense
                  rounded
                  @change="updateKey($event, entry, index)"
                />
              <v-text-field class="entry-value mr-5" v-model="entry.value" hint="property value" />
              <v-btn v-if="!remove" icon small @click="emitFieldToObject(entry, index)">
                <v-icon color="primary">mdi-cube-outline</v-icon>
              </v-btn>
            </div>
          </div>
          <v-card v-else rounded="lg" class="pa-3 my-6" elevation="4">
            <v-row align="center">
              <v-col>
               <v-card-title v-if="!editTitle" @mouseenter="mouseOver = true" @mouseleave="mouseOver = false">
                 {{ entry.key }}
                 <v-btn v-if="mouseOver" @click="editTitle = true" icon color="primary">
                   <v-icon small>mdi-pencil</v-icon>
                 </v-btn>
                </v-card-title>
                <v-card-title v-else>
                 <v-text-field v-model="entry.key">
                 </v-text-field>
                 <v-btn @click="editTitle = false" icon color="primary">
                   <v-icon small>mdi-check</v-icon>
                 </v-btn>
                </v-card-title>
            </v-col>
            <v-col cols="auto">
              <v-btn icon small @click="emitObjectToField(entry, index)">
                <v-icon color="primary">mdi-arrow-collapse-down</v-icon>
              </v-btn>
            </v-col>
            </v-row>
            <globals-entry
              :entries="entry.globals"
              :path="[...path, entry.key]"
              v-on="$listeners"
            />
          </v-card>
        </transition>
      </div>
    </draggable>
    <div
      slot="footer"
      key="footer"
      class="btn-group list-group-item ml-6 mt-3"
      role="group"
      aria-label="Basic example"
      v-if="!remove"
    >
      <v-btn color="primary" rounded fab small @click="emitAddProp">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </div>
  </v-container>
</template>
<script>
import draggable from 'vuedraggable'

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
    remove:{
      type: Boolean,
      default: false
    }
  },
  data(){
    return {
      editTitle: false,
      mouseOver: false,
    }
  },
  data() {
    return {
      drag: false,
      valid: true,
      rules: {
        keys(index, entries) {
          return [
            (v) => !!v || 'Properties need to have a name!',
            (v) => {
              let filtered = entries.filter((_, i) => i != index)
              if (filtered.findIndex((e) => e.key === v) === -1) return true
              else return 'A property with this name already exists'
            }
          ]
        }
      }
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
      let field = {
        key: `placeholder ${~~(Math.random() * 100)}`,
        type: 'field',
        value: 'random stuff'
      }
      this.$emit('add-prop', { field: field, path: this.path })
    },
    emitRemoveAt(index) {
      this.$emit('remove-prop', { path: this.path, index: index })
    },
    emitFieldToObject(entry, index) {
      let obj = {
        key: entry.key,
        type: 'object',
        globals: [
          { key: `placeholder ${~~(Math.random() * 100)}`, type: 'field', value: entry.value }
        ]
      }
      this.$emit('field-to-object', { obj: obj, path: this.path, index: index })
    },
    emitObjectToField(entry, index) {
      let fields = entry.globals
      this.$emit('object-to-field', { fields: fields, path: this.path, index: index })
    },
    hoverEffect(event){
      console.log('mouse here')
    },
    updateKey(input, entry, index) {
      //?: issues with this not working consistently!! sometimes validation returns false positive?
      if (this.$refs.keyInput[index].validate()) entry.key = input
      else if (input) entry.key = input + ' 2'
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
  letter-spacing: 1px;
  text-transform: uppercase;
}

.v-text-field {
  font-weight: 300;
}

.entry-key{
  font-weight: 500;
  position: relative;
  top: 0.6rem;
}

.entry-value{
}

.entry-delete{
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
