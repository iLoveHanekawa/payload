// import type { SerializedMarkNode } from '@lexical/mark'
import { MarkNode, $isMarkNode } from '@lexical/mark'
import { $isRangeSelection, $isLeafNode, $isTextNode, $isElementNode } from 'lexical'
import type { FeatureProvider } from '@payloadcms/richtext-lexical'
import { getSelectedNode } from '@payloadcms/richtext-lexical'
import { SectionWithEntries } from '@payloadcms/richtext-lexical/dist/field/features/format/common/floatingSelectToolbarSection'
import { markHTMLConverter } from './MarkHTMLConverter'
import { $findMatchingParent } from '@lexical/utils'
import CustomMarkNode, { UNWRAP_MARK_SELECTION, WRAP_SELECTION_WITHIN_MARK_COMMAND } from './CustomMark'

export const MarkFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        plugins: [{
          Component: () => {
            return import('./CustomMark').then(module => {
              return module.CustomMarkPlugin;
            })
          },
          position: 'normal'
        }],
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: () =>
                  import('./MarkIcon').then((module) => module.Markicon),
                isActive: ({ selection }) => {
                  let active = true;
                  if($isRangeSelection(selection)) {
                    const nodes = selection.getNodes();
                    const len = nodes.length;
                    for(let i = 0; i < len; i++) {
                      const node = nodes[i];
                      if($isMarkNode(node)) continue;
                      if($isTextNode(node) || ($isElementNode(node) && node.isInline())) {
                        const parent = node.getParent();
                        if(!$isMarkNode(parent)) {
                          active = false;
                        }
                      }
                    }
                  }
                  return active;
                },
                key: 'customMark',
                label: 'customMark',
                onClick: ({ editor, isActive }) => {
                  if(!isActive) {
                    editor.dispatchCommand(WRAP_SELECTION_WITHIN_MARK_COMMAND, null)
                  }
                  else {
                    editor.dispatchCommand(UNWRAP_MARK_SELECTION, null)
                  }
                },
                order: 5,
              },
            ]),
          ],          
        },
        nodes: [
          {
            converters: { html: markHTMLConverter},
            node: CustomMarkNode,
            type: CustomMarkNode.getType(),
            // TODO: Add validation similar to upload for internal links and fields
          },
          {
            node: MarkNode,
            type: MarkNode.getType()
          }
        ],
        // markdownTransformers: [INLINE_MARK],
        props: null,
      }
    },
    key: 'customMark',
  }
}