<template>
  <div class="mb-2">
    <v-expand-transition>
      <div v-show="expand" class="">
        <div v-for="(resource, index) in resources" :key="index">
          <commit-info-resource
            v-if="resource.type === 'commit'"
            :class="[index === 0 ? 'my-2' : 'my-4']"
            :resource="resource"
            @remove="
              (e) => {
                $emit('remove', e)
                removedResources.push(e)
              }
            "
          ></commit-info-resource>
          <object-info-resource
            v-if="resource.type === 'object'"
            :class="[index === 0 ? 'my-2' : 'my-4']"
            :resource="resource"
            @remove="
              (e) => {
                $emit('remove', e)
                removedResources.push(e)
              }
            "
          ></object-info-resource>
        </div>
        <div v-if="allowAdd && isLoggedIn" class="px-2 mb-2">
          <v-btn
            v-tooltip="'Overlay another commit or object'"
            block
            rounded
            class="primary"
            @click="$emit('show-add-overlay')"
          >
            add
          </v-btn>
        </div>
        <div v-show="removedResources.length !== 0" class="px-3 caption pb-5">
          Removed resources:
          <span
            v-for="(res, index) in removedResources"
            :key="index"
            v-tooltip="'Click to re-add'"
          >
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
              <span v-else>
                <v-icon x-small>mdi-source-commit</v-icon>
                {{ res.id }}
              </span>
            </a>
            <!-- eslint-disable-next-line prettier/prettier -->
            <span
              v-if="removedResources.length > 1 && index < removedResources.length - 1"
            >
              ,&nbsp;
            </span>
          </span>
        </div>
      </div>
    </v-expand-transition>
  </div>
</template>
<script>
import { useIsLoggedIn } from '@/main/lib/core/composables/core'
export default {
  components: {
    CommitInfoResource: () => import('@/main/components/viewer/CommitInfoResource'),
    ObjectInfoResource: () => import('@/main/components/viewer/ObjectInfoResource')
  },
  props: {
    resources: { type: Array, default: () => [] },
    allowAdd: {
      type: Boolean,
      default: true
    }
  },
  setup() {
    const { isLoggedIn } = useIsLoggedIn()
    return { isLoggedIn }
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
