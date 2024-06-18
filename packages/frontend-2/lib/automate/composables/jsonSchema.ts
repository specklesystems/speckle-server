import type { JsonSchema } from '@jsonforms/core'
import type { JsonFormsChangeEvent } from '@jsonforms/vue'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { formatJsonFormSchemaInputs } from '~/lib/automate/helpers/jsonSchema'

export const hasJsonFormErrors = (event?: JsonFormsChangeEvent) =>
  (event?.errors?.length || 0) > 0

export const useJsonFormsChangeHandler = (params: {
  schema: MaybeRef<MaybeNullOrUndefined<JsonSchema>>
}) => {
  const { schema } = params
  const event = ref<JsonFormsChangeEvent>()

  const value = computed(() =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    formatJsonFormSchemaInputs(event.value?.data, unref(schema))
  )
  const hasErrors = computed(() =>
    event.value ? hasJsonFormErrors(event.value) : false
  )

  const handler = (e: JsonFormsChangeEvent) => {
    event.value = e
  }

  const reset = () => {
    event.value = undefined
  }

  return {
    value,
    hasErrors,
    handler,
    reset
  }
}
