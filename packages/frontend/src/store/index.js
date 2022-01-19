import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// Note: this is currently used only for 3d viewer filtering purposes. All other state
// is handled by apollo. Ideally we would only add extra app state in here if really
// necessary (ie, component local state + events is not enough).
const store = new Vuex.Store({
  state: {
    appliedFilter: null,
    isolateKey: null,
    isolateValues: [],
    hideKey: null,
    hideValues: [],
    colorLegend: {},
    isolateCategoryKey: null,
    isolateCategoryValues: []
  },
  mutations: {
    isolateObjects(state, { filterKey, filterValues }) {
      state.hideKey = null
      state.hideValues = []
      if (state.isolateKey !== filterKey) state.isolateValues = []

      state.isolateKey = filterKey
      state.isolateValues = [...new Set([...state.isolateValues, ...filterValues])]
      if (state.isolateValues.length === 0) state.appliedFilter = null
      else
        state.appliedFilter = {
          filterBy: { [filterKey]: { includes: state.isolateValues } },
          ghostOthers: true
        }
      window.__viewer.applyFilter(state.appliedFilter)
    },
    unisolateObjects(state, { filterKey, filterValues }) {
      state.hideKey = null
      state.hideValues = []
      if (state.isolateKey !== filterKey) state.isolateValues = []

      state.isolateKey = filterKey
      state.isolateValues = state.isolateValues.filter((val) => filterValues.indexOf(val) === -1)
      if (state.isolateValues.length === 0) state.appliedFilter = null
      else
        state.appliedFilter = {
          filterBy: { [filterKey]: { includes: state.isolateValues } },
          ghostOthers: true
        }
      window.__viewer.applyFilter(state.appliedFilter)
    },
    hideObjects(state, { filterKey, filterValues }) {
      state.isolateKey = null
      state.isolateValues = []
      if (state.hideKey !== filterKey) state.hideValues = []

      state.hideKey = filterKey
      state.hideValues = [...new Set([...filterValues, ...state.hideValues])]

      if (state.hideValues.length === 0) state.appliedFilter = null
      else
        state.appliedFilter = {
          filterBy: { [filterKey]: { excludes: state.hideValues } }
        }
      window.__viewer.applyFilter(state.appliedFilter)
    },
    showObjects(state, { filterKey, filterValues }) {
      state.isolateKey = null
      state.isolateValues = []
      if (state.hideKey !== filterKey) state.hideValues = []

      state.hideKey = filterKey
      state.hideValues = state.hideValues.filter((val) => filterValues.indexOf(val) === -1)

      if (state.hideValues.length === 0) state.appliedFilter = null
      else
        state.appliedFilter = {
          filterBy: { [filterKey]: { excludes: state.hideValues } }
        }
      window.__viewer.applyFilter(state.appliedFilter)
    },
    async isolateCategoryToggle(state, { filterKey, filterValue, allValues, colorBy = false }) {
      this.commit('resetInternalHideIsolateObjectState')
      if (filterKey !== state.isolateCategoryKey) state.isolateCategoryValues = []
      state.isolateCategoryKey = filterKey

      let indx = state.isolateCategoryValues.indexOf(filterValue)
      if (indx === -1) state.isolateCategoryValues.push(filterValue)
      else state.isolateCategoryValues.splice(indx, 1)

      if (
        (state.isolateCategoryValues.length === 0 ||
          state.isolateCategoryValues.length === allValues.length) &&
        !colorBy
      ) {
        state.appliedFilter = null
        window.__viewer.applyFilter(state.appliedFilter)
        return
      }

      if (state.isolateCategoryValues.length === 0 && colorBy) {
        state.appliedFilter = {
          colorBy: { type: 'category', property: filterKey }
        }
      }
      if (state.isolateCategoryValues.length !== 0) {
        state.appliedFilter = {
          ghostOthers: true,
          filterBy: { [filterKey]: state.isolateCategoryValues },
          colorBy: colorBy ? { type: 'category', property: filterKey } : null
        }
      }
      if (state.isolateCategoryValues.length === allValues.length)
        delete state.appliedFilter.filterBy
      let res = await window.__viewer.applyFilter(state.appliedFilter)
      state.colorLegend = res.colorLegend
    },
    async toggleColorBy(state, { filterKey }) {
      if (state.appliedFilter && state.appliedFilter.colorBy) {
        state.appliedFilter.colorBy = null
      } else
        state.appliedFilter = {
          ...state.appliedFilter,
          colorBy: { type: 'category', property: filterKey }
        }
      let res = await window.__viewer.applyFilter(state.appliedFilter)
      state.colorLegend = res.colorLegend
    },
    resetInternalHideIsolateObjectState(state) {
      state.isolateKey = null
      state.isolateValues = []
      state.hideKey = null
      state.hideValues = []
    },
    resetInternalCategoryObjectState(state) {
      state.isolateCategoryKey = null
      state.isolateCategoryValues = []
    },
    resetFilter(state) {
      this.commit('resetInternalHideIsolateObjectState')
      this.commit('resetInternalCategoryObjectState')
      state.appliedFilter = null
      window.__viewer.applyFilter(state.appliedFilter)
    }
  }
})

export default store
