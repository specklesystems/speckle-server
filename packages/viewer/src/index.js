// POLYFILLS
import 'core-js'
import 'regenerator-runtime/runtime'

import { Viewer } from './modules/Viewer'
import Converter from './modules/converter/Converter'

export * from './modules/IViewer' // This is a workaround I'd rather not have
export { Viewer, Converter }
