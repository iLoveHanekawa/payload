import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import { SuperscriptFooterNode } from '../nodes/FooterNode';
import { mergeRegister } from '@lexical/utils'
import { $createSuperscriptFooterNode } from '../nodes/FooterNode';
import { INSERT_PARAGRAPH_COMMAND, $nodesOfType, ParagraphNode, SELECTION_CHANGE_COMMAND, DELETE_CHARACTER_COMMAND} from 'lexical'
import { $getSelection, createCommand, $isElementNode, $isRangeSelection, COMMAND_PRIORITY_LOW } from 'lexical'

export function SuperscriptFooterPlugin(): null {
    
    const INSERT_SUPERSCRIPT_FOOTER_COMMAND = createCommand('UPDATE_FOOTER_EDITOR_COMMAND');

    // ideally a custom paragraph command will be registered on the register node that is dispatch with the create paragraph command
    // this will resolve the nodes in a way that the footer node is at the end.
    const [editor] = useLexicalComposerContext()
    useEffect(() => {
      if (!editor.hasNodes([SuperscriptFooterNode])) {
        throw new Error('CustomSuperscriptLinkPlugin: CustomSuperscriptLinkNode not registered on editor')
      }
      return mergeRegister(
        editor.registerCommand(
            INSERT_PARAGRAPH_COMMAND, () => {
              const nodes = $nodesOfType(ParagraphNode);
              const parent = nodes[0].getParent();
              const superscriptFooterNodes = $nodesOfType(SuperscriptFooterNode);
              let footerNode: SuperscriptFooterNode | null = null;
              if(superscriptFooterNodes.length === 0) {
                footerNode = $createSuperscriptFooterNode();
              }
              else {
                footerNode = superscriptFooterNodes[0];
              }
              parent.append(footerNode);
            return false
          },
          COMMAND_PRIORITY_LOW,
        ),
      )
    }, [editor])
  
    return null
  }