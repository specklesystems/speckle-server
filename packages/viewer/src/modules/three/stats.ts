import StatsImport from 'three/examples/jsm/libs/stats.module.js'

export type Stats = StatsImport.default

// Workaround for broken three.js types
const Stats = StatsImport as unknown as () => Stats
export default Stats
