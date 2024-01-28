'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TOGGLE_LINK_WITH_MODAL_COMMAND } from '@payloadcms/richtext-lexical/dist/field/features/Link/plugins/floatingLinkEditor/LinkEditor/commands'
import { LinkNode, SerializedLinkNode, TOGGLE_LINK_COMMAND, type LinkFields, $createLinkNode } from "@payloadcms/richtext-lexical";
import { EditorConfig, createCommand, COMMAND_PRIORITY_LOW, SerializedTextNode, LexicalEditor, KEY_BACKSPACE_COMMAND as PARENT_KEY_BACKSPACE } from "lexical";
import { mergeRegister } from '@lexical/utils'
import { $getSelection, $nodesOfType, $createTextNode, $isRangeSelection, TextNode, FORMAT_TEXT_COMMAND, $applyNodeReplacement, type LexicalNode } from 'lexical'
import { useEffect } from 'react';
import { $getCustomSuperscriptLinkAncestor, $isCustomSuperscriptLinkNode } from './nodes/CustomSuperscriptLinkNode';
import { LinkPayload } from '@payloadcms/richtext-lexical/dist/field/features/Link/plugins/floatingLinkEditor/types';
import { TOGGLE_CUSTOM_SUPERSCRIPT_LINK_WITH_MODAL_COMMAND } from './plugins/floatingLinkEditor/LinkEditor/commands';

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

export const PUSH_CUSTOM_SUPERSCRIPT_NODE = createCommand('pushCustomSuperscriptNode');
export const RESOLVE_CUSTOM_SUPERSCRIPT_NODE_COUNT = createCommand('resolveCustomSuperscriptNodeCount');
export const KEY_BACKSPACE_COMMAND = createCommand('customKeyBackspace');


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
                    console.log({keyArray, maxKey, nodes});
                    const nodesArrLen = nodes.length;
                    console.log(keyArray);
                    const newImmutableNode = $createImmutableTextNode('1');

                    if(len > 1) {
                        console.log('case of multi nodes');
                        const targetNode = nodes[nodesArrLen - 1];
                        const linkAncestor = $getCustomSuperscriptLinkAncestor(targetNode);
                        console.log(linkAncestor);
                        if(!linkAncestor) {
                            targetNode.insertAfter(newImmutableNode);
                        }
                        else {
                            linkAncestor.insertAfter(newImmutableNode);
                        }
                    }
                    else {
                        // if the only node has a link ancestor, we have to append the new node to the link parent instead
                        const linkAncestor = $getCustomSuperscriptLinkAncestor(nodes[0]);
                        if(!linkAncestor) {
                            nodes[0].insertAfter(newImmutableNode);
                        }
                        else {
                            linkAncestor.insertAfter(newImmutableNode);
                        }
                    }
                    console.log(newImmutableNode.__key);
                    selection.anchor.key =  newImmutableNode.__key;
                    selection.focus.key = newImmutableNode.__key;
                    selection.anchor.offset = isBackward? newImmutableNode.getTextContentSize(): 0;
                    selection.focus.offset = isBackward? 0: newImmutableNode.getTextContentSize();
                    console.log({ afterUpdate: $getSelection().getNodes()})
                    const text = $getSelection().getTextContent();
                    console.log({ text })
                    const payload: LinkPayload = {
                        fields: {
                            doc: null,
                            linkType: 'custom',
                            newTab: false,
                            url: `#footer-${maxKey - 1}`
                        },
                        text
                    }
                    
                    editor.dispatchCommand(TOGGLE_CUSTOM_SUPERSCRIPT_LINK_WITH_MODAL_COMMAND, payload);
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
                }
                return false;
            }, COMMAND_PRIORITY_LOW),
            // try to optimize this because it looks performance taxing
            editor.registerCommand(RESOLVE_CUSTOM_SUPERSCRIPT_NODE_COUNT, () => {
                editor.update(() => {
                    const immutableTextNodes = $nodesOfType(ImmutableTextNode);
                    let number = 1;
                    immutableTextNodes.forEach(node => {
                        node.setTextContent(number.toString());
                        number += 1;
                        const parent = node.getParent();
                        if($isCustomSuperscriptLinkNode(parent)) {
                            parent.setFields({
                                url: `#footer-${number - 1}`,
                                doc: null,
                                linkType: 'custom',
                                newTab: false
                            })
                        }
                    })
                    
                });
                return false;
            }, COMMAND_PRIORITY_LOW),

            editor.registerCommand(KEY_BACKSPACE_COMMAND, (event) => {
                console.log(event);
                return true;
            }, COMMAND_PRIORITY_LOW)
        );
    }, [editor])
    return null;
}