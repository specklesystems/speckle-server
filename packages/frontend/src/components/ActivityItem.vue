<template>
  <v-card :link="modifier !== 'deleted'" :to="url">
    <v-card-text class="pa-2">
      <div :class="tagColor" class="rounded-pill pa-2 white--text d-inline-flex justify-center align-center">
        <v-icon small color="white">{{ activityInfo.icon }}</v-icon>
      </div>
      <span class="pa-2">
          {{ type | capitalize }}
         <span class="font-weight-bold font-italic primary--text">{{ this.activityInfo.name }} </span>
          <span>was {{ modifier }} </span>
          <span v-if="type !== 'stream'">
            in stream <span class="font-weight-bold font-italic primary--text">{{ this.stream ? this.stream.name : `[Deleted] ${this.activity.streamId}` }} </span>
          </span>
          <timeago :datetime="activity.time" class="font-italic"></timeago>
          by
          <v-chip small class="pl-0" v-if="user">
            <v-avatar color="grey lighten-3" class="mr-1">
              <img :src="user.avatar || `https://robohash.org/` + this.activity.userId + `.png?size=40x40`"
                   :alt="user.name">
            </v-avatar>
            {{ user.name }}
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
        id: this.activity.userId;
      }
    },
    stream: {
      query: gql`query($id: String!){ stream(id: $id){name}}`,
      variables() {
        return {
          id: this.activity.streamId
        };
      },
      skip() {
        return this.type === "stream";
      }
    }
  },
  methods: {},
  computed: {
    modifier() {
      return this.activity.actionType.split("_")[1] + "d";
    },
    type() {
      return this.activity.actionType.split("_")[0];
    },
    url(){
      if(this.modifier === "deleted") return
      switch (this.type){
        case "stream":
          return `/streams/${this.activity.streamId}`
        case "branch":
          return `/streams/${this.activity.streamId}/branches/${this.activity.info.branch.name}`
        case "commit":
          return `/streams/${this.activity.streamId}/commits/${this.activity.resourceId}`
        default:
          return null
      }
    },
    activityInfo() {
      switch (this.activity.actionType) {
        case "stream_create":
          return {
            icon: "mdi-cloud",
            name: this.activity.info.stream?.name
          };
        case "stream_delete":
          return {
            icon: "mdi-cloud-alert",
            name: this.activity.streamId
          };
        case "commit_create":
          return {
            icon: "mdi-timeline-plus",
            name: this.activity.resourceId
          };
        case "commit_delete":
          return {
            icon: "mdi-timeline-minus",
            name: this.activity.resourceId
          };
        case "branch_create":
          return {
            icon: "mdi-source-branch-plus",
            name: this.activity.info.branch.name
          };
        case "branch_delete":
          return {
            icon: "mdi-source-branch-minus",
            name: this.activity.info.branch.name
          };
        default:
          return {
            icon: "mdi-question",
            name: this.activity.actionType
          };
      }
    },
    tagColor() {
      var split = this.activity.actionType.split("_");
      var mod = split[1];
      switch (mod) {
        case "create":
          return "success";
        case "delete":
          return "error";
        default:
          return "primary";
      }
    }
  }
};
</script>

<style></style>
