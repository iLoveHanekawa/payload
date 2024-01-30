import type { HTMLConverter } from '@payloadcms/richtext-lexical'
import type { SerializedTextNode } from 'lexical'
import ImmutableTextNode from './CustomSuperscript'

export const CustomSuperscriptHTMLConverter = {
      converter: async ({ node }) => {
        return `${node.text}`
      },
      nodeTypes: [ImmutableTextNode.getType()],
} as HTMLConverter<SerializedTextNode>