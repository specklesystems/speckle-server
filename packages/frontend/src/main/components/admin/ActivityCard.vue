<template>
  <section-card expandable>
    <template #header>Usage Stats</template>
    <v-row v-if="!$apollo.loading" dense class="mt-2">
      <v-col v-for="value in graphSeries" :key="value.name" cols="12" sm="6">
        <p class="text-center caption primary--text">
          <v-icon x-small color="primary" class="mr-1">{{ icons[value.name] }}</v-icon>
          {{ capitalize(value.name.split('History')[0]) }} history
        </p>
        <apex-chart
          class="primary--text"
          type="bar"
          :options="options"
          :series="[value]"
        />
      </v-col>
    </v-row>
  </section-card>
</template>

<script>
import { gql } from '@apollo/client/core'
import { formatNumber } from '@/plugins/formatNumber.js'

const EXCLUDED_SERVER_STATS_KEYS = ['__typename']

export default {
  name: 'ActivityCard',
  components: {
    SectionCard: () => import('@/main/components/common/SectionCard')
  },
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
          formatter(val) {
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
            offsetY: 0
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
      `
    }
  },
  computed: {
    graphSeries() {
      let result = []
      const months = this.past12Months()
      if (this.serverStats) {
        const statsKeys = Object.keys(this.serverStats).filter(
          (k) => !EXCLUDED_SERVER_STATS_KEYS.includes(k)
        )
        result = statsKeys.map((key) => {
          const category = this.serverStats[key]
          const processed = []
          months?.forEach((month) => {
            let totalCount = 0
            category.forEach((value) => {
              const date = new Date(value.created_month)
              if (this.isSameMonth(month, date)) {
                totalCount = value.count
              }
            })
            processed.push([month, totalCount])
          })
          return { name: key, data: processed }
        })
      }
      return result.filter((val) => !!val.data)
    }
  },
  methods: {
    capitalize(word) {
      return word[0].toUpperCase() + word.slice(1).toLowerCase()
    },
    past12Months() {
      const now = new Date(Date.now())
      const dates = []
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 2)
        dates.push(d)
      }
      return dates
    },
    isSameMonth(refDate, date) {
      return (
        refDate.getUTCFullYear() === date.getUTCFullYear() &&
        refDate.getUTCMonth() === date.getUTCMonth()
      )
    }
  }
}
</script>
