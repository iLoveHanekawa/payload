import type { SerializedQuoteNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import CustomMarkNode,{ $createCustomMarkNode, $isCustomMarkNode, INSERT_CUSTOMMARK_COMMAND, CustomMarkPlugin } from './CustomMark'
import { $INTERNAL_isPointSelection, $getSelection, $isRangeSelection } from 'lexical'
import type { HTMLConverter } from '@payloadcms/richtext-lexical'
import type { FeatureProvider } from '@payloadcms/richtext-lexical'

import { SlashMenuOption } from '@payloadcms/richtext-lexical'
import { SectionWithEntries } from '@payloadcms/richtext-lexical/dist/field/features/format/common/floatingSelectToolbarSection'
import { convertLexicalNodesToHTML } from '@payloadcms/richtext-lexical'
import { MARK } from './markdownTransformer'

export const MarkFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        plugins: [{ 
          Component: async() => {
            return CustomMarkPlugin;
          }, position: 'bottom' }],
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: () =>
                  import('./MarkIcon').then((module) => module.Markicon),
                isActive: ({ selection }) => {
                  return false
                },
                key: 'mark',
                onClick: ({ editor, isActive }) => {
                  editor.dispatchCommand(INSERT_CUSTOMMARK_COMMAND, undefined);
                },
                order: 0,
              },
            ]),
          ],          
        },
        
        nodes: [
          {
            converters: {
              html: {
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
                nodeTypes: [CustomMarkNode.getType()],
              } as HTMLConverter<SerializedQuoteNode>,
            },
            node: CustomMarkNode,
            type: CustomMarkNode.getType(),
          },
        ],
        props: null,
        slashMenu: {
          options: [
            {
              displayName: 'Basic',
              key: 'basic',
              options: [
                new SlashMenuOption(`mark`, {
                  Icon: () =>
                    import('./MarkIcon').then(
                      (module) => module.Markicon,
                    ),
                  displayName: `Mark`,
                  keywords: ['customMark'],
                  onSelect: () => {
                    const selection = $getSelection();
                    if ($INTERNAL_isPointSelection(selection)) {
                    }
                  },
                }),
              ],
            },
          ],
        },
      }
    },
    key: 'customMark',
  }
}