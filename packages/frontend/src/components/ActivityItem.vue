<template>
    <v-card>
      <v-card-text class="pa-2">
        <div :class="tagColor" class="rounded-pill pa-2 white--text d-inline-flex justify-center align-center">
          <v-icon small color="white">{{activityInfo.icon}}</v-icon>
        </div>
        <span class="pa-2">
          {{ type | capitalize }}
<!--          <span class="font-weight-bold primary&#45;&#45;text">"{{ !this.activity.info ? null : this.activity.info[type].name }}" </span>-->
          was {{ modifier }}
          <timeago :datetime="activity.time"></timeago>

          by
          <v-chip small class="pl-0" v-if="user">
            <v-avatar color="grey lighten-3" class="mr-1">
              <img :src="user.avatar || `https://robohash.org/` + this.activity.userId + `.png?size=40x40`" :alt="user.name">
            </v-avatar>
            {{user.name}}
          </v-chip>
          <v-progress-circular v-else indeterminate></v-progress-circular>
        </span>
      </v-card-text>
    </v-card>
</template>

<script>
import UserAvatar from "@/components/UserAvatar";
import gql from "graphql-tag";
export default {
  components: { UserAvatar },
  props: ["activity"],
  apollo: {
    user: {
      query: gql`query($id: String) {
        user(id: $id){
          name
          avatar
        }
      }`,
      variables() {
        id: this.activity.userId
      }
    }
  },
  methods: {
  },
  computed: {
    modifier() {
      return this.activity.actionType.split("_")[1] + "d"
    },
    type() {
      return this.activity.actionType.split("_")[0]
    },
    activityInfo() {
      switch (this.activity.actionType) {
        case "stream_create":
          return {
            icon: "mdi-cloud",
            name: "Stream created"
          }
        case "stream_delete":
          return {
            icon: "mdi-cloud-alert",
            name: "Stream deleted"
          }
        case "commit_create":
          return {
            icon: "mdi-timeline-plus",
            name: "Commit created"
          }
        case "commit_delete":
          return {
            icon: "mdi-timeline-minus",
            name: "Commit deleted"
          }
        case "branch_create":
          return {
            icon: "mdi-source-branch-plus",
            name: "Branch created"
          }
        case "branch_delete":
          return {
            icon: "mdi-source-branch-minus",
            name: "Branch deleted"
          }
        default:
          return {
            icon: "mdi-question",
            name: this.activity.actionType
          }
      }
    },
    icon() {
      switch (this.activity.actionType) {
        case "stream_create":
          return "mdi-cloud"
        case "stream_delete":
          return "mdi-cloud-alert"
        case "commit_create":
          return "mdi-timeline-plus"
        case "commit_delete":
          return "mdi-timeline-minus"
        case "branch_create":
          return "mdi-source-branch-plus"
        case "branch_delete":
          return "mdi-source-branch-minus"
        default:
          return "mdi-plus"
      }
    },
    tagColor(){
      var split = this.activity.actionType.split("_")
      var mod = split[1]
      switch (mod){
        case "create":
          return "success"
        case "delete":
          return "error"
        default:
          return "primary"
      }
    }
  }
};
</script>

<style></style>
