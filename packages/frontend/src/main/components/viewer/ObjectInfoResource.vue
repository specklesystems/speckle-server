<template>
  <div>
    <v-card class="mx-2 mb-2 rounded-lg">
      <v-toolbar
        v-ripple
        class="transparent"
        flat
        style="cursor: pointer"
        @click.stop="expanded = !expanded"
      >
        <v-app-bar-nav-icon style="pointer-events: none">
          <v-icon large>mdi-cube-outline</v-icon>
        </v-app-bar-nav-icon>
        <v-chip small class="ma-1 caption grey white--text no-hover">Object</v-chip>
        <v-spacer />
        <v-btn
          v-if="$route.params.resourceId !== resource.id"
          v-tooltip="'Remove'"
          small
          icon
          @click.stop="$emit('remove', resource)"
        >
          <v-icon x-small>mdi-close</v-icon>
        </v-btn>
        <v-btn
          v-tooltip="'Toggle visibility'"
          small
          icon
          @click.stop="toggleVisibility()"
        >
          <v-icon class="grey--text" style="font-size: 12px">
            {{ visible ? 'mdi-eye' : 'mdi-eye-off' }}
          </v-icon>
        </v-btn>
        <v-btn v-tooltip="'Isolate objects'" small icon @click.stop="isolate()">
          <v-icon x-small :class="`${isolated ? 'primary--text' : ''}`">
            mdi-filter
          </v-icon>
        </v-btn>
        <v-btn small icon @click.stop="expanded = !expanded">
          <v-icon x-small>{{ expanded ? 'mdi-minus' : 'mdi-plus' }}</v-icon>
        </v-btn>
      </v-toolbar>
      <v-expand-transition>
        <div v-show="expanded" class="px-1">
          <object-properties
            :obj="{
              referencedId: resource.data.object.id
            }"
            :stream-id="resource.data.id"
          />
        </div>
      </v-expand-transition>
    </v-card>
  </div>
</template>
<script>
export default {
  components: {
    ObjectProperties: () => import('@/main/components/viewer/ObjectProperties')
  },
  props: {
    resource: {
      type: Object,
      default: () => null
    }
  },
  data() {
    return {
      expanded: false
    }
  },
  computed: {
    isolated() {
      return (
        this.$store.state.isolateValues.indexOf(this.resource.data.object.id) !== -1
      )
    },
    visible() {
      return this.$store.state.hideValues.indexOf(this.resource.data.object.id) === -1
    }
  },
  methods: {
    isolate() {
      let id = this.resource.data.object.id
      if (this.isolated)
        this.$store.commit('unisolateObjects', {
          filterKey: '__parents',
          filterValues: [id]
        })
      else
        this.$store.commit('isolateObjects', {
          filterKey: '__parents',
          filterValues: [id]
        })
    },
    toggleVisibility() {
      let id = this.resource.data.object.id
      if (this.visible)
        this.$store.commit('hideObjects', {
          filterKey: '__parents',
          filterValues: [id]
        })
      else
        this.$store.commit('showObjects', {
          filterKey: '__parents',
          filterValues: [id]
        })
    }
  }
}
</script>
