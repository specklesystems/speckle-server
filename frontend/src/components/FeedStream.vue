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
        <v-col cols="12" class="pb-2">
          <v-icon small>mdi-compare-vertical</v-icon>
          &nbsp;
          <strong>You</strong>
          created a new stream &nbsp;
          <timeago :datetime="stream.createdAt"></timeago>
        </v-col>
      </v-row>
      <v-card class="mb-3" elevation="0" rounded="lg" color="background2">
        <v-row>
          <v-col cols="7" class="pt-0 pb-0">
            <v-card-title class="subtitle-2">
              <router-link :to="'streams/' + stream.id">
                {{ stream.name }}
              </router-link>
            </v-card-title>
            <v-card-subtitle>
              {{ stream.description }}
            </v-card-subtitle>
          </v-col>
          <!-- <v-spacer></v-spacer> -->
          <v-col cols="5" class="caption text-right">
            <div class="mt-1 mr-4">
              <btn-click-copy :text="stream.id"></btn-click-copy>
              <router-link :to="'streams/' + stream.id" class="streamid">
                <span>{{ stream.id }}</span>
              </router-link>

              <!-- <v-icon small>mdi-key-outline</v-icon> -->
              <span class="ma-2"></span>
              <v-icon small>mdi-source-branch</v-icon>
              <span>{{ stream.branches.totalCount }}</span>

              <span class="ma-2"></span>
              <v-icon small>mdi-history</v-icon>
              <span>{{ stream.commits.totalCount }}</span>

              <span class="ma-2"></span>
              <v-icon small>mdi-account-outline</v-icon>
              <span>{{ stream.collaborators.length }}</span>

              <span class="ma-2"></span>
              <v-icon v-if="stream.isPublic" small>mdi-link</v-icon>
              <v-icon v-else small>mdi-link-lock</v-icon>
            </div>
          </v-col>
        </v-row>
      </v-card>
    </div>
  </div>
</template>
<script>
import BtnClickCopy from "./BtnClickCopy"

export default {
  components: { BtnClickCopy },
  props: {
    stream: {
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
    },
    isFeed: {
      type: Boolean,
      default: false
    }
  }
}
</script>
