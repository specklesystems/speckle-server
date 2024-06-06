import {
  type JsonFormsRendererRegistryEntry,
  and,
  isBooleanControl,
  isDateControl,
  isDateTimeControl,
  isEnumControl,
  isIntegerControl,
  isMultiLineControl,
  isNumberControl,
  isOneOfEnumControl,
  isStringControl,
  isTimeControl,
  rankWith,
  schemaTypeIs
} from '@jsonforms/core'
import { vanillaRenderers } from '@jsonforms/vue-vanilla'
import ArrayListRenderer from '~/components/form/json/ArrayListRenderer.vue'
import BooleanControlRenderer from '~/components/form/json/BooleanControlRenderer.vue'
import DateControlRenderer from '~/components/form/json/DateControlRenderer.vue'
import DateTimeControlRenderer from '~/components/form/json/DateTimeControlRenderer.vue'
import EnumControlRenderer from '~/components/form/json/EnumControlRenderer.vue'
import EnumOneOfControlRenderer from '~/components/form/json/EnumOneOfControlRenderer.vue'
import IntegerControlRenderer from '~/components/form/json/IntegerControlRenderer.vue'
import MultiStringControlRenderer from '~/components/form/json/MultiStringControlRenderer.vue'
import NumberControlRenderer from '~/components/form/json/NumberControlRenderer.vue'
import StringControlRenderer from '~/components/form/json/StringControlRenderer.vue'
import TimeControlRenderer from '~/components/form/json/TimeControlRenderer.vue'

export const stringControlRenderer: JsonFormsRendererRegistryEntry = {
  renderer: StringControlRenderer as unknown,
  tester: rankWith(3, isStringControl)
}

export const booleanControlRenderer: JsonFormsRendererRegistryEntry = {
  renderer: BooleanControlRenderer as unknown,
  tester: rankWith(3, isBooleanControl)
}

export const enumControlRenderer: JsonFormsRendererRegistryEntry = {
  renderer: EnumControlRenderer as unknown,
  tester: rankWith(6, isEnumControl)
}

export const enumOneOfControlRenderer: JsonFormsRendererRegistryEntry = {
  renderer: EnumOneOfControlRenderer as unknown,
  tester: rankWith(6, isOneOfEnumControl)
}

export const integerControlRenderer: JsonFormsRendererRegistryEntry = {
  renderer: IntegerControlRenderer as unknown,
  tester: rankWith(3, isIntegerControl)
}

export const multiStringControlRenderer: JsonFormsRendererRegistryEntry = {
  renderer: MultiStringControlRenderer as unknown,
  tester: rankWith(4, and(isStringControl, isMultiLineControl))
}

export const numberControlRenderer: JsonFormsRendererRegistryEntry = {
  renderer: NumberControlRenderer as unknown,
  tester: rankWith(3, isNumberControl)
}

export const dateControlRenderer: JsonFormsRendererRegistryEntry = {
  renderer: DateControlRenderer as unknown,
  tester: rankWith(4, isDateControl)
}

export const dateTimeControlRenderer: JsonFormsRendererRegistryEntry = {
  renderer: DateTimeControlRenderer as unknown,
  tester: rankWith(4, isDateTimeControl)
}

export const timeControlRenderer: JsonFormsRendererRegistryEntry = {
  renderer: TimeControlRenderer as unknown,
  tester: rankWith(4, isTimeControl)
}

export const arrayListRenderer: JsonFormsRendererRegistryEntry = {
  renderer: ArrayListRenderer as unknown,
  tester: rankWith(3, schemaTypeIs('array'))
}

export const renderers: JsonFormsRendererRegistryEntry[] = markRaw([
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ...vanillaRenderers,
  stringControlRenderer,
  booleanControlRenderer,
  enumControlRenderer,
  enumOneOfControlRenderer,
  integerControlRenderer,
  multiStringControlRenderer,
  numberControlRenderer,
  dateControlRenderer,
  dateTimeControlRenderer,
  timeControlRenderer,
  arrayListRenderer
])
