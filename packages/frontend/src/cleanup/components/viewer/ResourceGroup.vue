<template>
  <div>
    <v-list v-if="resources.length > 1" dense nav class="mt-0 py-0 mb-3">
      <v-list-item
        :class="`px-2 list-overlay-${$vuetify.theme.dark ? 'dark' : 'light'} elevation-3`"
        style="position: sticky; top: 82px"
        @click="expand = !expand"
      >
        <v-list-item-action>
          <v-icon small>
            {{
              resources.length < 10
                ? 'mdi-numeric-' + resources.length + '-box-multiple'
                : 'mdi-numeric-9-plus-box-multiple'
            }}
          </v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>Loaded Resources</v-list-item-title>
        </v-list-item-content>
        <v-list-item-action class="pa-0 ma-0">
          <v-btn small icon @click.stop="expand = !expand">
            <v-icon>{{ expand ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </v-list>
    <v-expand-transition>
      <div v-show="expand" class="mt-3">
        <resource
          v-for="(resource, index) in resources"
          :key="index"
          :resource="resource"
          :is-multiple="resources.length !== 0"
          :expand-initial="resources.length === 0"
          @remove="
            (e) => {
              $emit('remove', e)
              removedResources.push(e)
            }
          "
        />

        <div v-show="removedResources.length !== 0" class="px-3 caption pb-5">
          Removed resources:
          <span v-for="(res, index) in removedResources" :key="index" v-tooltip="'Click to re-add'">
            <a
              @click="
                $emit('add-resource', res.id)
                removedResources.splice(
                  removedResources.findIndex((r) => r.id === res.id),
                  1
                )
              "
            >
              <span v-if="res.type === 'object'">Object</span>
              <!-- eslint-disable-next-line prettier/prettier -->
              <span v-else><v-icon x-small>mdi-source-commit</v-icon>{{ res.id }}</span>
            </a>
            <!-- eslint-disable-next-line prettier/prettier -->
            <span v-if="removedResources.length > 1 && index < removedResources.length - 1">,&nbsp;
            </span>
          </span>
        </div>
      </div>
    </v-expand-transition>
  </div>
</template>
<script>
export default {
  components: {
    Resource: () => import('@/cleanup/components/viewer/Resource')
  },
  props: {
    resources: { type: Array, default: () => [] }
  },
  data() {
    return {
      expand: true,
      removedResources: []
    }
  }
}
</script>
<style scoped>
.list-overlay-dark {
  background: rgba(40, 40, 40, 1);
  z-index: 5;
}
.list-overlay-light {
  background: rgba(235, 235, 235, 1);
  z-index: 5;
}
</style>
