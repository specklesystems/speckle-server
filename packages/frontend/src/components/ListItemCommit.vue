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
          :avatar="user.userId"
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
      <v-card v-if="activity">
        <v-toolbar>
          <v-toolbar-title>Full commit activity</v-toolbar-title>
        </v-toolbar>
        <v-card-text  class="pt-2 pb-2 pl-3 pr-3" v-for="obj in activity.items" v-bind:key="obj.id">
          <v-list-item class="pl-2 pr-0">
              <!-- <user-avatar class="pr-3"
                :id="obj.userId"
                :key="obj.userId"
                :avatar="obj.userId"
                :size="40"
                :name="obj.userId.name"
                :show-hover="true"
              />  -->
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
        query UserData($userId1: String! $userId2: String! $userId3: String! $userId4: String!) {
          user1: user(id: $userId1) {
            id
            name
            avatar
          }
          user2: user(id: $userId2) {
            id
            name
            avatar
          }
          user3: user(id: $userId3) {
            id
            name
            avatar
          }
          user4: user(id: $userId4) {
            id
            name
            avatar
          }
        }
      `,
      update: (data) => data,
      variables() {
        return {
          userId1: this.idUnique[0],
          userId2: this.idUnique[1],
          userId3: this.idUnique[2],
          userId4: this.idUnique[3] 
        }
      },
      skip() {
        if (!this.idUnique || this.idUnique.length==0 ) return true 
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
      userAvatars: [],
      idUnique: [],
      currentId: null
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
      let set = new Set()
      if ( val && val.items && val.items.length>0) {
        val.items.forEach((item) => set.add(item.userId))
        this.receivedUsersUnique = Array.from(set)
        this.receivedUsersAll = val.items
        
        this.receivedUsersUnique.forEach(obj => { 
          if (obj) {
            this.idUnique.push(obj), console.log("loop in progress"), console.log(this.idUnique)//,  console.log(val)
          }
        })
        do {this.idUnique.push(this.idUnique[0])} while (this.idUnique.length<4) //fill all 4 users with fake data
      } 
    }, 
    userData(val) {
      console.log("query was called, the data received: ")
      console.log(val)
      if (val.user1.avatar) this.userAvatars.push(val.user1.avatar)
      if (val.user2.avatar) this.userAvatars.push(val.user2.avatar) 
      if (val.user3.avatar) this.userAvatars.push(val.user3.avatar) 
      if (val.user4.avatar) this.userAvatars.push(val.user4.avatar) 
      console.log(this.userAvatars)
    }
  },
  methods: {
    goToBranch() {
      this.$router.push(this.branchUrl)
    },
    callApollo() {
      console.log(this.currentId)
      this.currentId = this.currentId
    }
  }
}
</script>
