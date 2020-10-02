<template>
  <v-app id="inspire">
    <v-app-bar app color="white" flat>
      <v-container class="py-0 fill-height">
        


        <v-btn text to="/">
          <v-img contain max-height="30" max-width="30" src="./assets/logo.svg" />
          <div class="mt-1">
            <span class="primary--text"><b>SPECKLE</b></span>&nbsp;<span class="font-weight-light">ADMIN</span>
          </div>
          
        </v-btn>

        <v-btn v-for="link in navLinks" :key="link.name" text class="text-uppercase" :to="link.link">
          {{ link.name }}
        </v-btn>

        <v-spacer></v-spacer>

        <v-responsive max-width="260">
          <v-text-field
            dense
            flat
            hide-details
            rounded
            solo-inverted
          ></v-text-field>
        </v-responsive>
      </v-container>
    </v-app-bar>

    <v-main class="grey lighten-3">
      <v-container>
        <v-row>
          <v-col cols="3">
            <v-sheet rounded="lg">
              <v-sheet rounded="lg" class="pa-4 text-center">
                <v-avatar class="mb-4" color="grey lighten-1" size="64">
                  <v-img v-if="user.avatar" :src="user.avatar" />
                  <v-icon>mdi-account</v-icon>
                </v-avatar>

                <div>
                  <strong>{{ user.name }}</strong>
                </div>
                <div>{{ user.company }}</div>
                <code>{{ user.id }}</code>
              </v-sheet>

              <v-divider></v-divider>
              <v-list color="transparent">
                <v-list-item v-for="n in 5" :key="n" link>
                  <v-list-item-content>
                    <v-list-item-title> List Item {{ n }} </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-sheet>
          </v-col>

          <v-col>
            <!-- <v-sheet min-height="70vh" rounded="lg"> -->
              <v-main class="pt-0">
                <router-view :user="user"></router-view>
              </v-main>
            <!-- </v-sheet> -->
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
<script>
import gql from "graphql-tag"

export default {
  name: "App",
  apollo: {
    user: {
      query: gql`
        query {
          user {
            id
            email
            name
            bio
            company
            avatar
            verified
            profiles
            role
            streams(limit: 25) {
              totalCount
              cursor
              items {
                id
                name
                description
                isPublic
                createdAt
                updatedAt
                collaborators {
                  id
                  name
                  role
                }
              }
            }
          }
        }
      `,
    },
  },
  components: {},

  data: () => ( {
    user: {},
    navLinks: [ 
      {link: "/streams", name:"streams"}, 
      {link: "/teams", name:"teams"}, 
      {link: "/profile", name:"profile"}, 
      {link: "/settings", name:"settings"}, 
      {link: "/help", name:"help"}
    ] } ),
  
  watch:{
    user( val ){
      console.log( val )
    }
  }
}
</script>
