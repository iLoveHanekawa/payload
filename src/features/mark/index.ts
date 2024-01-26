// import type { SerializedMarkNode } from '@lexical/mark'
import { MarkNode, $isMarkNode } from '@lexical/mark'
import { $isRangeSelection, $setSelection } from 'lexical'
import type { FeatureProvider,  } from '@payloadcms/richtext-lexical'
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
                  if($isRangeSelection(selection)) {
                    const selectedNode = getSelectedNode(selection)
                    const linkParent = $findMatchingParent(selectedNode, $isMarkNode)
                    return linkParent != null
                  }
                  return false;
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
                order: 6,
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