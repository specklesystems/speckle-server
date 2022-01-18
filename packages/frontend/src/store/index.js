import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    isolateKey: null,
    isolateValues: [],
    hideKey: null,
    hideValues: []
  },
  mutations: {
    isolateObjects(state, { filterKey, filterValues }) {
      state.hideKey = null
      state.hideValues = []
      if (state.isolateKey !== filterKey) state.isolateValues = []

      state.isolateKey = filterKey
      state.isolateValues = [...new Set([...state.isolateValues, ...filterValues])]
      if (state.isolateValues.length === 0) window.__viewer.applyFilter(null)
      else
        window.__viewer.applyFilter({
          filterBy: { [filterKey]: { includes: state.isolateValues } },
          ghostOthers: true
        })
    },
    unisolateObjects(state, { filterKey, filterValues }) {
      state.hideKey = null
      state.hideValues = []
      if (state.isolateKey !== filterKey) state.isolateValues = []

      state.isolateKey = filterKey
      state.isolateValues = state.isolateValues.filter((val) => filterValues.indexOf(val) === -1)
      if (state.isolateValues.length === 0) window.__viewer.applyFilter(null)
      else
        window.__viewer.applyFilter({
          filterBy: { [filterKey]: { includes: state.isolateValues } },
          ghostOthers: true
        })
    },
    hideObjects(state, { filterKey, filterValues }) {
      state.isolateKey = null
      state.isolateValues = []
      if (state.hideKey !== filterKey) state.hideValues = []

      state.hideKey = filterKey
      state.hideValues = [...new Set([...filterValues, ...state.hideValues])]

      if (state.hideValues.length === 0) window.__viewer.applyFilter(null)
      else
        window.__viewer.applyFilter({
          filterBy: { [filterKey]: { excludes: state.hideValues } }
        })
    },
    showObjects(state, { filterKey, filterValues }) {
      state.isolateKey = null
      state.isolateValues = []
      if (state.hideKey !== filterKey) state.hideValues = []

      state.hideKey = filterKey
      state.hideValues = state.hideValues.filter((val) => filterValues.indexOf(val) === -1)

      if (state.hideValues.length === 0) window.__viewer.applyFilter(null)
      else
        window.__viewer.applyFilter({
          filterBy: { [filterKey]: { excludes: state.hideValues } }
        })
    },
    resetFilter(state) {
      state.isolateKey = null
      state.isolateValues = []
      state.hideKey = null
      state.hideValues = []
      window.__viewer.applyFilter(null)
    }
  }
})

export default store
