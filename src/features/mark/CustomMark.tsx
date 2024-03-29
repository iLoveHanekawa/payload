'use client'

import type { NodeKey, LexicalNode, RangeSelection } from "lexical";
import { createCommand, COMMAND_PRIORITY_LOW, $isElementNode, $getSelection, $isRangeSelection, $isTextNode, $applyNodeReplacement, $setSelection } from "lexical";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { MarkNode, SerializedMarkNode, $unwrapMarkNode, $isMarkNode, $createMarkNode } from "@lexical/mark";
import { mergeRegister } from '@lexical/utils'
import { useEffect } from "react";

export default class CustomMarkNode extends MarkNode {

    // insertNewAfter(selection: RangeSelection, restoreSelection = true) {
    //     return super.insertNewAfter(selection, restoreSelection);
    // }

    constructor(ids: string[], key?: NodeKey) {
        super(ids, key);
    }

    static clone(node: CustomMarkNode): CustomMarkNode {
        return new CustomMarkNode(node.__ids, node.__key);
    }
    
    static getType() {
        return 'customMark'
    }

    static importJSON(serializedNode: SerializedMarkNode) {
        const node = $createCustomMarkNode(serializedNode.ids);
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    exportJSON(): SerializedMarkNode {
        return super.exportJSON();
    }
}

export function $createCustomMarkNode(ids: string[]): CustomMarkNode {
    return $applyNodeReplacement(new CustomMarkNode(ids));
}

export function $isCustomMarkNode(node: LexicalNode): node is CustomMarkNode {
    return node instanceof CustomMarkNode;
}

export function $wrapSelectionInMarkNode(selection: RangeSelection, isBackward: boolean, id: string, createNode = $createMarkNode) {
    const selectionBuffer: MarkNode[] = [];
    const nodes = selection.getNodes();
    const anchorOffset = selection.anchor.offset;
    const focusOffset = selection.focus.offset;
    const nodesLength = nodes.length;
    const startOffset = isBackward ? focusOffset : anchorOffset;
    const endOffset = isBackward ? anchorOffset : focusOffset;
    let currentNodeParent: LexicalNode;
    let lastCreatedMarkNode: MarkNode;
    let anchorKey = selection.anchor.key;
    let focusKey = selection.focus.key;
    let updatedAnchorOffset = selection.anchor.offset;
    let updatedFocusOffset = selection.focus.offset;
    // We only want wrap adjacent text nodes, line break nodes
    // and inline element nodes. For decorator nodes and block
    // element nodes, we step out of their boundary and start
    // again after, if there are more nodes.
    for (let i = 0; i < nodesLength; i++) {
      const node = nodes[i];
      if ($isElementNode(lastCreatedMarkNode) && lastCreatedMarkNode.isParentOf(node)) {
        // If the current node is a child of the last created mark node, there is nothing to do here
        continue;
      }
      const isFirstNode = i === 0;
      const isLastNode = i === nodesLength - 1;
      let targetNode: LexicalNode = null;
      if ($isTextNode(node)) {
        // Case 1: The node is a text node and we can split it
        const textContentSize = node.getTextContentSize();
        //TODO
        const startTextOffset = isFirstNode ? startOffset : 0;
        const endTextOffset = isLastNode ? endOffset : textContentSize;
        if (startTextOffset === 0 && endTextOffset === 0) {
          continue;
        }
        const splitNodes = node.splitText(startTextOffset, endTextOffset);
        if(splitNodes.length > 1 && (splitNodes.length === 3 || isFirstNode && !isLastNode || endTextOffset === textContentSize)) {
            targetNode = splitNodes[1];
            if(isBackward) {
                if(node.__key === focusKey) {
                    focusKey = splitNodes[1].__key;
                    if(node.__key === anchorKey) {
                        anchorKey = focusKey;
                        updatedAnchorOffset = splitNodes[1].getTextContentSize();
                    }
                    updatedFocusOffset = 0;
                }
            }
            else {
                if(node.__key === anchorKey) {
                    anchorKey = splitNodes[1].__key;
                    if(node.__key === focusKey) {
                        focusKey = anchorKey;
                        updatedFocusOffset = splitNodes[1].getTextContentSize();
                    }
                    updatedAnchorOffset = 0;
                }
            }
        }
        else {
            targetNode = splitNodes[0]
        }
      } else if ($isMarkNode(node)) {
        // Case 2: the node is a mark node and we can ignore it as a target,
        // moving on to its children. Note that when we make a mark inside
        // another mark, it may utlimately be unnested by a call to
        // `registerNestedElementResolver<MarkNode>` somewhere else in the
        // codebase.
  
        continue;
      } else if ($isElementNode(node) && node.isInline()) {
        // Case 3: inline element nodes can be added in their entirety to the new
        // mark
        targetNode = node;
      }
      if (targetNode !== null) {
        // Now that we have a target node for wrapping with a mark, we can run
        // through special cases.
        if (targetNode && targetNode.is(currentNodeParent)) {
          // The current node is a child of the target node to be wrapped, there
          // is nothing to do here.
          continue;
        }
        const parentNode = targetNode.getParent();
        if (parentNode == null || !parentNode.is(currentNodeParent)) {
          // If the parent node is not the current node's parent node, we can
          // clear the last created mark node.
          if(lastCreatedMarkNode) selectionBuffer.push(lastCreatedMarkNode);
          lastCreatedMarkNode = undefined;
        }
        currentNodeParent = parentNode;
        if (lastCreatedMarkNode === undefined) {
          // If we don't have a created mark node, we can make one
          const createMarkNode = createNode || $createMarkNode;
          lastCreatedMarkNode = createMarkNode([id]);
          targetNode.insertBefore(lastCreatedMarkNode);
        }
  
        // Add the target node to be wrapped in the latest created mark node
        lastCreatedMarkNode.append(targetNode);
    } else {
        // If we don't have a target node to wrap we can clear our state and
        // continue on with the next node
        if(lastCreatedMarkNode) selectionBuffer.push(lastCreatedMarkNode);
        currentNodeParent = undefined;
        lastCreatedMarkNode = undefined;
      }
    }

    // Make selection collapsed at the end
    if ($isElementNode(lastCreatedMarkNode)) {
        // eslint-disable-next-line no-unused-expressions
        isBackward ? lastCreatedMarkNode.selectStart() : lastCreatedMarkNode.selectEnd();
    }
    return { anchorKey, focusKey, updatedAnchorOffset, updatedFocusOffset };
    // const rangeSelection = $createRangeSelection()
    // rangeSelection.insertNodes(selectionBuffer);
    // $setSelection(rangeSelection);
}



export const WRAP_SELECTION_WITHIN_MARK_COMMAND = createCommand('wrapSelectionWithingMark');
export const UNWRAP_MARK_SELECTION = createCommand('unWrapSelection');

export function CustomMarkPlugin(): null {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        if(!editor.hasNodes([CustomMarkNode])) {
            throw new Error("CustomMarkPlugin: CustomMarkPlugin is not registered on the editor")
        }
        return mergeRegister(

            editor.registerCommand(WRAP_SELECTION_WITHIN_MARK_COMMAND, () => {
                const selection = $getSelection();
                if($isRangeSelection(selection)) {
                    const { anchorKey, focusKey, updatedAnchorOffset, updatedFocusOffset } = $wrapSelectionInMarkNode(selection, selection.isBackward(), 'mark-node');
                    editor.update(() => {
                        const selection = $getSelection();
                        if($isRangeSelection(selection)) {
                            selection.focus.key = focusKey;
                            selection.focus.offset = updatedFocusOffset;
                            selection.anchor.offset = updatedAnchorOffset;
                            selection.anchor.key = anchorKey;
                        }
                        $setSelection(selection);
                    })
                }
                return false;
            }, COMMAND_PRIORITY_LOW),

            editor.registerCommand(UNWRAP_MARK_SELECTION, () => {
                const selection = $getSelection();
                if($isRangeSelection(selection)) {
                    const nodes = selection.getNodes();
                    for(let i = 0; i < nodes.length; i++) {
                        const node = nodes[i];
                        const parent = node.getParent();
                        if($isMarkNode(parent)) {
                            $unwrapMarkNode(parent);
                        }
                    }
                }
                return false;
            }, COMMAND_PRIORITY_LOW)
        )
    }, [editor])
    return null;
}