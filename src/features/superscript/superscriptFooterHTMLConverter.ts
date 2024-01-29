import { convertLexicalNodesToHTML } from '@payloadcms/richtext-lexical'
import { MarkNode } from '@lexical/mark'
import type { HTMLConverter } from '@payloadcms/richtext-lexical'
import type { SerializedMarkNode } from '@lexical/mark'
import type { SerializedListNode } from '@lexical/list'
import { SuperscriptFooterNode } from './nodes/FooterNode'

export const superscriptFooterHTMLConverter = {
      converter: async ({ converters, node, parent }) => {
        const childrenText = await convertLexicalNodesToHTML({
          converters,
          lexicalNodes: node.children,
          parent: {
            ...node,
            parent,
          },
        })
        return `
        <footer><ul>${childrenText}</ul></footer>
        `
      },
      nodeTypes: [SuperscriptFooterNode.getType()],
    } as HTMLConverter<SerializedListNode>