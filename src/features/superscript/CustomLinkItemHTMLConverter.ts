import { convertLexicalNodesToHTML } from '@payloadcms/richtext-lexical'
import type { HTMLConverter } from '@payloadcms/richtext-lexical'
import { ListItemNode, SerializedListItemNode } from '@lexical/list'


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