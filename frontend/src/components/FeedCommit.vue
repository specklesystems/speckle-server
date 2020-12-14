<template>
  <div>
    <div class="text-center" style="position: absolute">
      <user-avatar
        :id="user.id"
        :avatar="user.avatar"
        :name="user.name"
        :size="30"
      />
    </div>
    <div class="ml-12">
      <v-row class="caption">
        <v-col class="pb-2">
          <v-icon small>mdi-history</v-icon>
          &nbsp; You have
          <strong>
            <span v-if="commit.items">
              {{ commit.items.length }} new commits
            </span>
            <span v-else>a new commit</span>
          </strong>
          in
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
          <router-link :to="`streams/${commit.streamId}/commits/${commit.id}`">
            {{ commit.message }}
          </router-link>
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
                <v-list-item
                  v-for="(item, i) in commit.items"
                  :key="i"
                  :to="`streams/${item.streamId}/commits/${item.id}`"
                >
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
import UserAvatar from "./UserAvatar"

export default {
  components: { UserAvatar },
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
