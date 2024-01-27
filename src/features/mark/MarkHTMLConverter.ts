import { convertLexicalNodesToHTML } from '@payloadcms/richtext-lexical'
import { MarkNode } from '@lexical/mark'
import type { HTMLConverter } from '@payloadcms/richtext-lexical'
import type { SerializedMarkNode } from '@lexical/mark'

export const markHTMLConverter = {
      converter: async ({ converters, node, parent }) => {
        const childrenText = await convertLexicalNodesToHTML({
          converters,
          lexicalNodes: node.children,
          parent: {
            ...node,
            parent,
          },
        })
        return `<mark>${childrenText}</mark>`
      },
      nodeTypes: [MarkNode.getType()],
    } as HTMLConverter<SerializedMarkNode>