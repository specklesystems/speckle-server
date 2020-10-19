<template>
  <div>
    <div class="text-center" style="position: absolute">
      <v-avatar class="mt-10" color="background2" size="40">
        <v-img v-if="user.avatar" :src="user.avatar" />
        <v-img
          v-else
          :src="`https://robohash.org/` + user.id + `.png?size=40x40`"
        />
      </v-avatar>
    </div>
    <div class="ml-12">
      <v-row class="caption">
        <v-col class="pb-2">
          <v-icon small>mdi-history</v-icon>
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

      <v-card class="mb-3" elevation="0" rounded="lg" color="background2">
        <v-card-title v-if="!commit.items" class="subtitle-2">
          {{ commit.message }}
        </v-card-title>
        <v-expansion-panels v-else flat color="background2">
          <v-expansion-panel>
            <v-expansion-panel-header class="pl-4" color="background2">
              <span class="subtitle-2">
                {{ commit.message }}
              </span>
            </v-expansion-panel-header>
            <v-expansion-panel-content color="background2">
              <v-list dense color="background2">
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
    },
    user: {
      type: Object,
      default: function () {
        return {}
      }
    }
  }
}
</script>
