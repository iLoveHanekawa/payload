import { convertLexicalNodesToHTML } from '@payloadcms/richtext-lexical'
import { MarkNode } from '@lexical/mark'
import type { HTMLConverter, SerializedLinkNode } from '@payloadcms/richtext-lexical'
import type { SerializedMarkNode } from '@lexical/mark'
import { CustomSuperscriptLinkNode } from './nodes/CustomSuperscriptLinkNode'

export const CustomSuperscriptHTMLLinkConverter = {
      converter: async ({ converters, node, parent }) => {
        const childrenText = await convertLexicalNodesToHTML({
          converters,
          lexicalNodes: node.children,
          parent: {
            ...node,
            parent,
            version: 2
          },
        })

        const rel: string = node.fields.newTab ? ' rel="noopener noreferrer"' : ''

        const href: string =
          node.fields.linkType === 'custom'
            ? node.fields.url
            : (node.fields.doc?.value as string)
        return `<sup><a href="${href}" rel="${rel}">${childrenText}</a></sup>`
      },
      nodeTypes: [CustomSuperscriptLinkNode.getType()],
    } as HTMLConverter<SerializedLinkNode>