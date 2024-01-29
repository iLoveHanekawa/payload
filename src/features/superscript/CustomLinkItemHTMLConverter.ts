import { convertLexicalNodesToHTML } from '@payloadcms/richtext-lexical'
import { MarkNode } from '@lexical/mark'
import type { HTMLConverter } from '@payloadcms/richtext-lexical'
import type { SerializedMarkNode } from '@lexical/mark'
import { SerializedListNode, ListItemNode, SerializedListItemNode } from '@lexical/list'
import { SuperscriptFooterNode } from './nodes/FooterNode'


export const CustomLinkItemHTMLConverter = {
      converter: async ({ converters, node, parent }) => {
        const childrenText = await convertLexicalNodesToHTML({
          converters,
          lexicalNodes: node.children,
          parent: {
            ...node,
            parent,
          },
        })
        return `<li>${childrenText}</li>`
      },
      nodeTypes: [ListItemNode.getType()],
} as HTMLConverter<SerializedListItemNode>