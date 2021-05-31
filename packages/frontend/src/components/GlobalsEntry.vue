<template>
  <v-container>
    <draggable :list="entries" class="dragArea pl-0" tag="ul" group="globals" @change="log">
      <div v-for="(entry, index) in entries" :key="index">
        <div v-if="!entry.globals">
            <div class="d-flex align-center" @mouseover="hoverEffect">
              <v-btn v-if="remove" class="entry-delete mr-5" fab rounded x-small color="error" @click="emitRemoveAt(index)">
                <v-icon>mdi-minus</v-icon>
              </v-btn>
              <v-text-field class="entry-key mr-5" v-model="entry.key" hint="property name" filled dense rounded/>
              <v-text-field class="entry-value mr-5" v-model="entry.value" hint="property value" />
              <v-btn v-if="!remove" icon small @click="emitFieldToObject(entry, index)">
                <v-icon color="primary">mdi-cube-outline</v-icon>
              </v-btn>
            </div>
        </div>
        <v-card v-if="entry.globals" rounded="lg" class="pa-3 my-6" elevation="4">
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
          <globals-entry :entries="entry.globals" :path="[...path, entry.key]" :remove="remove" v-on="$listeners" />
        </v-card>
      </div>
    </draggable>
    <div
      slot="footer"
      class="btn-group list-group-item ml-6 mt-3"
      role="group"
      aria-label="Basic example"
      key="footer"
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
  computed: {},
  methods: {
    log(evt) {
      window.console.log(evt)
    },
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
      console.log('in field to obj')
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
    }
  }
}
</script>
<style scoped>
.v-card{
  background-color: rgba(0, 0, 0, 0.1);
}

.v-card__title {
  font-weight: 500;
  font-size: large;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.v-text-field{
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

</style>
