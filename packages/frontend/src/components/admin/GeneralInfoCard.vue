<template>
  <admin-card title="Info" v-bind="$attrs">
    <div class="d-flex justify-space-around">
      <div v-for="(value, name) in serverStats" class="flex-grow-1">
        <h4 class="primary--text text--lighten-2 text-center">
          Total {{ name }} </h4>
        <v-tooltip bottom color="primary" :disabled="value < 1000">
          <template v-slot:activator="{ on, attrs }">
            <p class="primary--text text-h3 text-md-h2 text-lg-h1 text-center" v-bind="attrs" v-on="on">
              <animated-number :value="value" class="speckle-gradient-txt"/>
            </p>
          </template>
          <span>{{ value }}</span>
        </v-tooltip>
      </div>
    </div>
  </admin-card>
</template>

<script>
import AdminCard from "@/components/admin/AdminCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import gql from "graphql-tag";

export default {
  name: "GeneralInfoCard",
  components: { AnimatedNumber, AdminCard },
  apollo: {
    serverStats: {
      query: gql`query {
        serverStats {
            totalObjectCount
            totalCommitCount
            totalStreamCount
            totalUserCount
        }
      }`,
      update(data){
        var stats = data.serverStats
        return {
          users: stats.totalUserCount,
          streams: stats.totalStreamCount,
          commits: stats.totalCommitCount,
          objects: stats.totalObjectCount
        }
      }
    }
  }
};
</script>

<style scoped lang="scss">

</style>
