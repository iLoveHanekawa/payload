import type { FieldPermissions } from 'payload/auth'
import type { Field, FieldWithPath } from 'payload/types'
import type { FieldTypes } from 'payload/config'
import type { ReducedField } from './filterFields'

export type Props = {
  className?: string
  fieldTypes: FieldTypes
  forceRender?: boolean
  margins?: 'small' | false
  permissions?:
    | {
        [field: string]: FieldPermissions
      }
    | FieldPermissions
  readOnly?: boolean
} & (
  | {
      // Fields to be filtered by the component
      fieldSchema: FieldWithPath[]
      filter?: (field: Field) => boolean
      indexPath?: string
    }
  | {
      // Pre-filtered fields to be simply rendered
      fields: ReducedField[]
    }
)
