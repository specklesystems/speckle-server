import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// Note: this is currently used only for 3d viewer filtering purposes. All other state
// is handled by apollo. Ideally we would only add extra app state in here if really
// necessary (ie, component local state + events is not enough).
const store = new Vuex.Store({
  state: {
    viewerBusy: false,
    appliedFilter: null,
    isolateKey: null,
    isolateValues: [],
    hideKey: null,
    hideValues: [],
    colorLegend: {},
    isolateCategoryKey: null,
    isolateCategoryValues: [],
    hideCategoryKey: null,
    hideCategoryValues: [],
    selectedComment: null,
    addingComment: false,
    preventCommentCollapse: false
  },
  mutations: {
    setViewerBusy(state, { viewerBusyState }) {
      state.viewerBusy = viewerBusyState
    },
    setAddingCommentState(state, { addingCommentState }) {
      state.addingComment = addingCommentState
    },
    setCommentSelection(state, { comment }) {
      if (comment) window.__viewer.interactions.deselectObjects()
      state.selectedComment = comment
    },
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
      state.isolateValues = state.isolateValues.filter(
        (val) => filterValues.indexOf(val) === -1
      )
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
      state.hideValues = state.hideValues.filter(
        (val) => filterValues.indexOf(val) === -1
      )

      if (state.hideValues.length === 0) state.appliedFilter = null
      else
        state.appliedFilter = {
          filterBy: { [filterKey]: { excludes: state.hideValues } }
        }
      window.__viewer.applyFilter(state.appliedFilter)
    },
    async isolateCategoryToggle(
      state,
      { filterKey, filterValue, allValues, colorBy = false }
    ) {
      this.commit('resetInternalHideIsolateObjectState')
      state.hideCategoryKey = null
      state.hideCategoryValues = []

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
    async hideCategoryToggle(state, { filterKey, filterValue, colorBy = false }) {
      this.commit('resetInternalHideIsolateObjectState')
      state.isolateCategoryKey = null
      state.isolateCategoryValues = []
      if (filterKey !== state.hideCategoryKey) state.hideCategoryValues = []
      state.hideCategoryKey = filterKey

      let indx = state.hideCategoryValues.indexOf(filterValue)
      if (indx === -1) state.hideCategoryValues.push(filterValue)
      else state.hideCategoryValues.splice(indx, 1)

      if (state.hideCategoryValues.length === 0 && !colorBy) {
        state.appliedFilter = null
        window.__viewer.applyFilter(state.appliedFilter)
        return
      }

      if (state.hideCategoryValues.length === 0 && colorBy) {
        state.appliedFilter = {
          colorBy: { type: 'category', property: filterKey }
        }
      }
      if (state.hideCategoryValues.length !== 0) {
        state.appliedFilter = {
          filterBy: { [filterKey]: { not: state.hideCategoryValues } },
          colorBy: colorBy ? { type: 'category', property: filterKey } : null
        }
      }
      let res = await window.__viewer.applyFilter(state.appliedFilter)
      state.colorLegend = res.colorLegend
    },
    async toggleColorByCategory(state, { filterKey }) {
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
    setNumericFilter(
      state,
      { filterKey, minValue, maxValue, gradientColors = ['#3F5EFB', '#FC466B'] }
    ) {
      this.commit('resetInternalHideIsolateObjectState')
      this.commit('resetInternalCategoryObjectState')
      state.appliedFilter = {
        ghostOthers: true,
        colorBy: {
          type: 'gradient',
          property: filterKey,
          minValue,
          maxValue,
          gradientColors
        },
        filterBy: { [filterKey]: { gte: minValue, lte: maxValue } }
      }
      window.__viewer.applyFilter(state.appliedFilter)
    },
    async setFilterDirect(state, { filter }) {
      let filterBy = filter.filterBy
      if (filterBy && filterBy.__parents) {
        if (filterBy.__parents.includes) {
          this.commit('isolateObjects', {
            filterKey: '__parents',
            filterValues: filterBy.__parents.includes
          })
          return
        }
        if (filterBy.__parents.excludes) {
          this.commit('hideObjects', {
            filterKey: '__parents',
            filterValues: filterBy.__parents.excludes
          })
          return
        }
      } else if (filter.ghostOthers) {
        // means it's isolate by category or numeric filter
        if (filter.colorBy && filter.colorBy.type === 'gradient') {
          this.commit('setNumericFilter', {
            filterKey: Object.keys(filter.filterBy)[0],
            minValue: filter.filterBy[Object.keys(filter.filterBy)[0]].gte,
            maxValue: filter.filterBy[Object.keys(filter.filterBy)[0]].lte
          })
        } else {
          let values = filterBy[Object.keys(filter.filterBy)[0]]
          for (const val of values) {
            let f = {
              filterKey: Object.keys(filter.filterBy)[0],
              filterValue: val,
              allValues: [],
              colorBy: filter.colorBy
            }
            this.commit('isolateCategoryToggle', f)
          }
        }
      } else {
        let values = filterBy[Object.keys(filter.filterBy)[0]].not
        for (const val of values) {
          let f = {
            filterKey: Object.keys(filter.filterBy)[0],
            filterValue: val,
            allValues: [],
            colorBy: filter.colorBy
          }
          this.commit('hideCategoryToggle', f)
        }
      }
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
      state.hideCategoryKey = null
      state.hideCategoryValues = []
    },
    resetFilter(state) {
      this.commit('resetInternalHideIsolateObjectState')
      this.commit('resetInternalCategoryObjectState')
      state.appliedFilter = null
      state.preventCommentCollapse = true
      window.__viewer.applyFilter(state.appliedFilter)
    },
    setPreventCommentCollapse(state, { value }) {
      state.preventCommentCollapse = value
    }
  }
})

export default store
