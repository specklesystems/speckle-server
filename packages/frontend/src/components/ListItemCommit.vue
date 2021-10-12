<template>
  <v-list-item class="xxx-elevation-10">
    <v-list-item-icon class="pl-4">
      <user-avatar
        :id="commit.authorId"
        :avatar="commit.authorAvatar"
        :name="commit.authorName"
        :size="40"
      />
    </v-list-item-icon>

    <v-list-item-content>
      <v-list-item-title class="mt-0 pt-0 py-1">
        <router-link
          class="text-decoration-none"
          :to="route ? route : `/streams/${streamId}/commits/${commit.id}`"
        >
          {{ commit.message }}
        </router-link>
      </v-list-item-title>
      <v-list-item-subtitle class="caption">
        <b>{{ commit.authorName }}</b>
        &nbsp;
        <timeago :datetime="commit.createdAt"></timeago>
        ({{ commitDate }})
      </v-list-item-subtitle>
    </v-list-item-content>

    <v-list-item-action
      v-if="receivedUsersAll.length > 0"
      style="cursor: pointer"
      @click="showAllActivityDialog = true"
      v-tooltip="'Click to see all commit receives.'"
    >
      <p class="text-end mt-2 mb-0">
        <!-- Can be also "Received X times" -->
        <v-list-item-title class="caption">
          Received by {{ receivedUsersAll[0].message.split('received by')[1] }}
        </v-list-item-title>
      </p>
      <v-list-item-subtitle class="mt-2 caption">
        <p>
          <timeago :datetime="receivedUsersAll[0].time"></timeago>
        </p>
      </v-list-item-subtitle>
    </v-list-item-action>

    <v-list-item-action class="pl-4 pt-0 mt-0" @click="showAllActivityDialog = true" v-tooltip="'Click to see all commit receives.'">
      <div>
        <!-- Fix avatar size for small views (e.g. Stream home) -->
        <user-avatar
          v-for="user in receivedUsersUnique.slice(0, 4)"
          :id="user"
          :key="user"
          :avatar="userAvatar"
          :size="30"
          :name="user.userId"
          :show-hover="false"
        />
        <v-avatar v-if="receivedUsersUnique.length > 4" size="30" color="grey">
          <span class="white--text">+{{ receivedUsersUnique.length - 4 }}</span>
        </v-avatar>
      </div>
    </v-list-item-action>

    <v-list-item-action>
      <div>
        <span v-if="commit.branchName" class="caption">
          <v-chip
            v-tooltip="`On branch '${commit.branchName}'`"
            small
            color="primary"
            :to="`/streams/${streamId}/branches/${commit.branchName}`"
          >
            <v-icon small class="mr-2">mdi-source-branch</v-icon>
            {{ commit.branchName }}
          </v-chip>
        </span>
        <source-app-avatar :application-name="commit.sourceApplication" />
      </div>
    </v-list-item-action>
    <br />
    <v-dialog
      v-model="showAllActivityDialog"
      max-width="400"
      :fullscreen="$vuetify.breakpoint.xsOnly"
    >
      <v-card>
        <v-toolbar>
          <v-toolbar-title>Full commit activity</v-toolbar-title>
        </v-toolbar>
        <v-card-text class="pt-2 pb-2 pl-3 pr-3" v-for="obj in activity.items" v-bind:key="obj.id">
          <v-list-item class="pl-0 pr-0">
              <user-avatar class="pr-3"
                :id="obj.userId"
                :key="obj.userId"
                :avatar="userAvatar"
                :size="40"
                :name="obj.userId.name"
                :show-hover="true"
              /> 
            <v-list-item-content>
              <v-list-item-title>
                <b> {{ obj.message.split('received by')[1] }} </b> received
                <timeago :datetime="obj.time"></timeago> in 
              </v-list-item-title>

              <v-list-item-subtitle class="caption">
                {{obj.info.message}}
              </v-list-item-subtitle>
            </v-list-item-content>
            <source-app-avatar class="mt-3 mb-3"   :application-name="obj.info.sourceApplication" />
          </v-list-item>

        </v-card-text>
      </v-card>
      
    </v-dialog>
  </v-list-item>
</template>
<script>
//style="position: relative; float: right"
import gql from 'graphql-tag'
import UserAvatar from './UserAvatar'
import SourceAppAvatar from './SourceAppAvatar'
//import userByIdQuery from '../graphql/userById.gql'

export default {
  components: { UserAvatar, SourceAppAvatar },
  props: ['commit', 'streamId', 'route'],
  apollo: {
    activity: {
      query: gql`
        query CommitActivity($streamId: String!, $commitId: String!) {
          stream(id: $streamId) {
            id
            commit(id: $commitId) {
              id
              activity(actionType: "commit_receive", limit: 200) {
                items {
                  info
                  time
                  userId
                  message
                }
              }
            }
          }
        }
      `,
      update: (data) => data.stream.commit.activity,
      variables() {
        return {
          streamId: this.streamId,
          commitId: this.commit.id
        }
      },
      skip() {
        if (!this.streamId || !this.commit) return true
        return false
      }
    },
    userData: {
      query: gql`
        query UserData($userId: String!) {
          user(id: $userId) {
            name
            bio
            company
            avatar
          }
        }
      `,
      update: (data) => data.user,
      variables() {
        return {
          userId: this.receivedUsersUnique[0] /////////////fake code
        }
      },
      skip() {
        if (!this.receivedUsersUnique[0] ) return true /////////////fake code
        return false
      }
    }
  },
  data() {
    return {
      activity: null,
      receivedUsersAll: [],
      receivedNamesAll: [],
      receivedUsersUnique: [],
      showAllActivityDialog: false,

      userData: null,
      userAvatar: null
    }
  },
  computed: {
    commitDate() {
      if (!this.commit) return null
      let date = new Date(this.commit.createdAt)
      let options = { year: 'numeric', month: 'long', day: 'numeric' }

      return date.toLocaleString(undefined, options)
    },
    branchUrl() {
      if (!this.commit) return null
      return `${window.location.origin}/streams/${
        this.$route.params.streamId
      }/branches/${encodeURIComponent(this.commit.branchName)}`
    }
  },
  watch: {
    activity(val) {
      //console.log(val.items)
      let set = new Set()
      if (val.items && val.items.length>0) {
        val.items.forEach((item) => set.add(item.userId))
        this.receivedUsersUnique = Array.from(set)
        this.receivedUsersAll = val.items
      } 
    },
    userData(val) {
      this.userAvatar = val.avatar
      //console.log(this.userAvatar)
    }
  },
  methods: {
    goToBranch() {
      this.$router.push(this.branchUrl)
    }
  }
}
</script>
