import type { TextFormatTransformer } from '@lexical/markdown'

export const MARK: TextFormatTransformer = {
  format: ['mark'],
  tag: '`',
  type: 'text-format',
}