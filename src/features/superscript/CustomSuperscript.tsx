'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LinkNode, SerializedLinkNode, TOGGLE_LINK_COMMAND, type LinkFields, $createLinkNode } from "@payloadcms/richtext-lexical";
import { EditorConfig, createCommand, COMMAND_PRIORITY_LOW, SerializedTextNode, LexicalEditor } from "lexical";
import { mergeRegister } from '@lexical/utils'
import { $getSelection, $createTextNode, $isRangeSelection, TextNode, FORMAT_TEXT_COMMAND, $applyNodeReplacement, type LexicalNode } from 'lexical'
import { useEffect } from 'react';

export default class ImmutableTextNode extends TextNode {

    constructor(__text: string, __key?: string) {
        super(__text, __key);
    }

    static getType() {
        return 'immutableTextNode';
    }
    updateDOM(prevNode: TextNode, dom: HTMLElement, config: EditorConfig): boolean {
        return super.updateDOM(prevNode, dom, config);
    }
    createDOM(config: EditorConfig, editor: LexicalEditor) {
        return super.createDOM(config, editor);
    }
    static clone(node: ImmutableTextNode) {
        return $createImmutableTextNode(node.getTextContent(), node.__key);
    }

    canInsertTextAfter(): boolean {
        return false;
    }

    canInsertTextBefore(): boolean {
        return false;
    }
    
    exportJSON(): SerializedTextNode {
        return {
            detail: this.getDetail(),
            format: this.getFormat(),
            mode: this.getMode(),
            style: this.getStyle(),
            text: this.getTextContent(),
            type: ImmutableTextNode.getType(),
            version: 1
          };
        // return super.exportJSON();
    }
    static importJSON(serializedNode: SerializedTextNode) {
        const node = $createImmutableTextNode(serializedNode.text);
        node.setFormat(serializedNode.format);
        node.setDetail(serializedNode.detail);
        node.setMode(serializedNode.mode);
        node.setStyle(serializedNode.style);
        return node;
    }
    
}

export const $createImmutableTextNode = (__text: string, __key?: string): ImmutableTextNode => {
    return new ImmutableTextNode(__text, __key);
}

export const PUSH_CUSTOM_SUPERSCRIPT_NODE = createCommand('createCustomSuperscriptNode');
export const RESOLVE_CUSTOM_SUPERSCRIPT_NODE_COUNT = createCommand('resolveCustomSuperscriptNodeCount');

export function ImmutableTextNodePlugin(): null {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        if(!editor.hasNodes([ImmutableTextNode])) {
            throw new Error('ImmutableTextNodePlugin: ImmutableTextNodePlugin is not registered on the editor')
        }
        return mergeRegister(
            editor.registerCommand(PUSH_CUSTOM_SUPERSCRIPT_NODE, () => {
                const selection = $getSelection();
                if($isRangeSelection(selection)) {
                    const keyArray = Array.from(editor._keyToDOMMap.keys());
                    let maxKey = 0;
                    const len = keyArray.length;
                    for(let i = 0; i < len; i++) {
                        const currentKey = keyArray[i];
                        if(currentKey === 'root') continue;
                        const currentKeyVal = parseInt(currentKey);
                        maxKey = Math.max(maxKey, currentKeyVal);
                    }
                    const isBackward = selection.isBackward();
                    const nodes = selection.getNodes();
                    const nodesArrLen = nodes.length;
                    console.log(keyArray);
                    const newImmutableNode = $createImmutableTextNode('1');
                    nodes[nodesArrLen - 1].insertAfter(newImmutableNode);
                    selection.anchor.key =  newImmutableNode.__key;
                    selection.focus.key = newImmutableNode.__key;
                    selection.anchor.offset = isBackward? newImmutableNode.getTextContentSize(): 0;
                    selection.focus.offset = isBackward? 0: newImmutableNode.getTextContentSize();

                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
                    // editor.dispatchCommand(TOGGLE_LINK_COMMAND, undefined);
                }
                return false;
            }, COMMAND_PRIORITY_LOW)
        );
    }, [editor])
    return null;
}