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
          },
        })

        const rel: string = node.fields.newTab ? ' rel="noopener noreferrer"' : ''

        const href: string =
          node.fields.linkType === 'custom'
            ? node.fields.url
            : (node.fields.doc?.value as string)

        return `<a href="${href}"${rel}>${childrenText}</a>`
      },
      nodeTypes: [CustomSuperscriptLinkNode.getType()],
    } as HTMLConverter<SerializedLinkNode>