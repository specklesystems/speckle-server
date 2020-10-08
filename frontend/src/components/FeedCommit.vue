<template>
  <div>
    <div class="text-center" style="position: absolute">
      <v-avatar class="mt-11" color="grey lighten-1" size="32">
        <!-- <v-img :src="user.avatar" /> -->
        <v-icon>mdi-account</v-icon>
      </v-avatar>
    </div>
    <div class="ml-12">
      <v-row class="caption">
        <v-col class="pb-2">
          <v-icon small color="grey lighten-1">mdi-cube-outline</v-icon>
          &nbsp;
          <strong>You</strong>
          pushed
          <span v-if="commit.items">{{ commit.items.length }} commits</span>
          <span v-else>a commit</span>
          to
          <strong>
            <router-link :to="'streams/' + commit.streamId">
              {{ commit.streamName }}
            </router-link>
          </strong>
          &nbsp;
          <timeago :datetime="commit.createdAt"></timeago>
        </v-col>
      </v-row>

      <v-card class="mb-3" elevation="0" rounded="lg">
        <v-card-title v-if="!commit.items" class="subtitle-2">
          {{ commit.message }}
        </v-card-title>
        <v-expansion-panels v-else flat>
          <v-expansion-panel>
            <v-expansion-panel-header class="pl-4">
              <span class="subtitle-2">
                {{ commit.message }}
              </span>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-list dense>
                <v-list-item v-for="(item, i) in commit.items" :key="i">
                  <div style="width: 100%">
                    <v-row class="caption">
                      <v-col>
                        <span class="caption">{{ item.message }}</span>
                      </v-col>
                      <v-spacer></v-spacer>
                      <v-col class="text-right">
                        <timeago :datetime="item.createdAt"></timeago>
                      </v-col>
                    </v-row>
                    <v-divider v-if="i < commit.items.length - 1"></v-divider>
                  </div>
                </v-list-item>
              </v-list>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    commit: {
      type: Object,
      default: function () {
        return {}
      }
    }
  }
}
</script>
