<template>
  <div>
    <div class="text-center py-3" style="position: absolute">
      <user-avatar :id="user.id" :avatar="user.avatar" :name="user.name" :size="30" />
    </div>
    <div class="ml-12">
      <v-row class="caption py-3">
        <v-col class="pb-2">
          <v-icon small>mdi-source-commit</v-icon>
          &nbsp; You have
          <strong>
            <span v-if="commit.items">{{ commit.items.length }} new commits</span>
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

      <v-card class="mb-3" elevation="0" rounded="lg">
        <v-card-title v-if="!commit.items" class="subtitle-2">
          <router-link :to="`streams/${commit.streamId}/commits/${commit.id}`">
            {{ commit.message }}
          </router-link>
        </v-card-title>
        <v-expansion-panels v-else multiple :value="expando" flat>
          <v-expansion-panel>
            <v-expansion-panel-header class="pl-4">
              <span class="subtitle-2">
                {{ commit.message }}
              </span>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-list dense>
                <v-list-item
                  v-for="(item, i) in commit.items"
                  :key="i"
                  :to="`streams/${item.streamId}/commits/${item.id}`"
                >
                  <v-list-item-content>
                    <v-list-item-title>{{ item.message }}</v-list-item-title>
                  </v-list-item-content>
                  <v-list-item-icon class="caption">
                    <timeago :datetime="item.createdAt"></timeago>
                  </v-list-item-icon>
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
import UserAvatar from './UserAvatar'

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
  },
  data() {
    return {
      expando: [0]
    }
  }
}
</script>
