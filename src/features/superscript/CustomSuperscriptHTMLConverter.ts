import { convertLexicalNodesToHTML } from '@payloadcms/richtext-lexical'
import { MarkNode } from '@lexical/mark'
import type { HTMLConverter } from '@payloadcms/richtext-lexical'
import type { SerializedMarkNode } from '@lexical/mark'
import type { SerializedTextNode } from 'lexical'
import { CustomSuperscriptLinkNode } from './nodes/CustomSuperscriptLinkNode'
import ImmutableTextNode from './CustomSuperscript'

export const CustomSuperscriptHTMLConverter = {
      converter: async ({ node }) => {
        return `${node.text}`
      },
      nodeTypes: [ImmutableTextNode.getType()],
    } as HTMLConverter<SerializedTextNode>