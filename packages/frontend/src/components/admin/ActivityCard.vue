<template>
  <admin-card title="Usage stats" v-bind="$attrs">
    <v-row dense>
      <v-col cols="6">
        <apexchart type="bar" height="150" :options="userData.options" :series="userData.series"/>
      </v-col>
      <v-col cols="6">
        <apexchart type="bar" height="150" :options="userData.options" :series="userData.series"/>
      </v-col>
    </v-row>
  </admin-card>
</template>

<script>
import AdminCard from '@/components/admin/AdminCard'

export default {
  name: 'ActivityCard',
  components: { AdminCard },
  data() {
    return {
      userData: {
        options: {
          chart: {
            id: 'newUserData',
            toolbar: {
              show: false
            },
            zoom: {
              enabled: false
            }
          },
          dataLabels: {
            enabled: false
          },
          tooltip: {
            enabled: true
          },
          xaxis: {
            labels: {
              show: false
            },
            axisTicks: {
              show: false
            },
            axisBorder: {
              show: false
            }
          },
          yaxis: {
            show: false,
            axisTicks: {
              show: false
            }
          },
          grid: {
            show: false
          },
          plotOptions: {
            bar: {
              borderRadius: 10,
              columnWidth: '90%',
              barHeight: '10%',
              dataLabels: {
                position: 'top' // top, center, bottom
              }
            }
          }
        },
        series: [
          {
            name: 'series-1',
            data: [30, 40, 45, 50, 49, 60, 70, 91, 100,44,61,98, 20]
          }
        ]
      }
    }
  }
}
</script>

<style scoped></style>
