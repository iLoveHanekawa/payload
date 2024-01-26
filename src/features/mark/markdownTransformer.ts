import type { TextFormatTransformer } from '@lexical/markdown'

export const INLINE_MARK: TextFormatTransformer = {
  format: ['highlight'],
  tag: 'mark',
  type: 'text-format'
}