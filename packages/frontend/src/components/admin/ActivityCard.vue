<template>
  <admin-card title="Usage stats" v-bind="$attrs">
    <v-row dense v-if="!$apollo.loading">
      <v-col cols="6" v-if="value.data" v-for="value in graphSeries" :key="value.name">
        <p class="text-center caption primary--text">
          <v-icon x-small color="primary" class="mr-1">{{ icons[value.name] }}</v-icon>
          {{ capitalize(value.name.split('History')[0]) }} history
        </p>
        <apexchart class="primary--text" type="bar" :options="options" :series="[value]" />
      </v-col>
    </v-row>
  </admin-card>
</template>

<script>
import AdminCard from '@/components/admin/AdminCard'
import gql from 'graphql-tag'
import { formatNumber } from '@/formatNumber.js'

export default {
  name: 'ActivityCard',
  components: { AdminCard },
  data() {
    return {
      icons: {
        commitHistory: 'mdi-cloud-upload-outline',
        streamHistory: 'mdi-cloud-outline',
        objectHistory: 'mdi-cube-outline',
        userHistory: 'mdi-account-outline'
      },
      options: {
        states: {
          active: {
            filter: {
              type: 'none' /* none, lighten, darken */
            }
          }
        },
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
          enabled: true,
          position: 'bottom',
          formatter: function (val) {
            return formatNumber(val)
          },
          offsetY: -25,
          style: {
            fontSize: '10px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 'bold',
            colors: undefined
          },
          background: {
            enabled: true,
            foreColor: '#fff',
            padding: 6,
            borderRadius: 5,
            borderWidth: 2,
            borderColor: undefined,
            opacity: 0.9
          }
        },
        tooltip: {
          enabled: false
        },
        xaxis: {
          type: 'datetime',
          axisBorder: {
            show: false
          },
          labels: {
            show: true,
            rotate: 0,
            rotateAlways: true,
            hideOverlappingLabels: true,
            showDuplicates: false,
            trim: false,
            style: {
              colors: [],
              fontSize: '12px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-xaxis-label text-center'
            },
            offsetX: 0,
            offsetY: 0,
            // format: undefined,
            // formatter: undefined,
            // datetimeUTC: true,
            // datetimeFormatter: {
            //   year: 'yyyy',
            //   month: 'M/yy'
            // }
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
      }
    }
  },
  apollo: {
    serverStats: {
      query: gql`
        query {
          serverStats {
            commitHistory
            objectHistory
            userHistory
            streamHistory
          }
        }
      `,
      update(data) {
        var stats = data.serverStats
        delete stats.__typename
        return stats
      }
    }
  },
  computed: {
    graphSeries() {
      var result = []
      var months = this.past12Months()
      if (this.serverStats) {
        result = Object.keys(this.serverStats).map((key) => {
          var category = this.serverStats[key]
          var processed = []
          months?.forEach((month) => {
            var totalCount = 0
            category.forEach((value) => {
              var date = this.parseISOString(value.created_month)
              if (this.isSameMonth(month, date)) {
                totalCount = value.count
              }
            })
            processed.push([month, totalCount])
          })
          return { name: key, data: processed }
        })
      }
      return result
    }
  },
  methods: {
    capitalize(word) {
      return word[0].toUpperCase() + word.slice(1).toLowerCase()
    },
    past12Months() {
      var now = new Date(Date.now())
      var dates = []
      for (let i = 0; i < 12; i++) {
        var d = new Date(now.getFullYear(), now.getMonth() - i, 2)
        dates.push(d)
      }
      return dates
    },
    isSameMonth(refDate, date) {
      return (
        refDate.getUTCFullYear() === date.getUTCFullYear() &&
        refDate.getUTCMonth() === date.getUTCMonth()
      )
    },
    parseISOString(s) {
      var b = s.split(/\D+/)
      return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]))
    },
    isoFormatDMY(d) {
      function pad(n) {
        return (n < 10 ? '0' : '') + n
      }
      return pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear()
    }
  }
}
</script>

<style scoped>
.apexcharts-xaxis-label {
  color: #8ab16f;
}
</style>
