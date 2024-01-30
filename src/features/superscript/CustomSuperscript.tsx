'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { sanitizeEditorConfig, consolidateHTMLConverters, convertLexicalToHTML, type EditorConfig as PayloadEditorConfig, $createLinkNode, LinkNode, LinkFields } from "@payloadcms/richtext-lexical";
import { type EditorConfig, createCommand, COMMAND_PRIORITY_LOW, SerializedTextNode, LexicalEditor } from "lexical";
import { mergeRegister } from '@lexical/utils'
import { $getSelection, $nodesOfType, $isRangeSelection, TextNode, FORMAT_TEXT_COMMAND, $isParagraphNode, SerializedParagraphNode, $createParagraphNode, $createTextNode } from 'lexical'
import { useEffect } from 'react';
import { $createListItemNode } from '@lexical/list'
import { $getCustomSuperscriptLinkAncestor, $isCustomSuperscriptLinkNode } from './nodes/CustomSuperscriptLinkNode';
import { LinkPayload } from '@payloadcms/richtext-lexical/dist/field/features/Link/plugins/floatingLinkEditor/types';
import { TOGGLE_CUSTOM_SUPERSCRIPT_LINK_WITH_MODAL_COMMAND } from './plugins/floatingLinkEditor/LinkEditor/commands';
import { $createSuperscriptFooterNode, SuperscriptFooterNode } from './nodes/FooterNode';
import { type SerializedEditorState, type LexicalNode, ParagraphNode, SerializedLexicalNode } from 'lexical'
import {
  SerializedLinkNode
} from '@payloadcms/richtext-lexical'

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
                    const nodesArrLen = nodes.length;
                    const newImmutableNode = $createImmutableTextNode('1');

                    if(len > 1) {
                        const targetNode = nodes[nodesArrLen - 1];
                        const linkAncestor = $getCustomSuperscriptLinkAncestor(targetNode);
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
                    selection.anchor.key =  newImmutableNode.__key;
                    selection.focus.key = newImmutableNode.__key;
                    selection.anchor.offset = isBackward? newImmutableNode.getTextContentSize(): 0;
                    selection.focus.offset = isBackward? 0: newImmutableNode.getTextContentSize();
                    const text = $getSelection().getTextContent();
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
                async function lexicaltToHTML(editorData: SerializedEditorState, editorConfig: PayloadEditorConfig) {
                    const sanitizedConfig = sanitizeEditorConfig(editorConfig);
                    return await convertLexicalToHTML({
                      converters: consolidateHTMLConverters({ editorConfig: sanitizedConfig }),
                      data: editorData,
                    })
                  }
                  
                editor.update(async() => {
                    // disgusting mess of casting, fix this asap 
                    function dfs(node: SerializedLexicalNode): LexicalNode {
                        let parentNode: LexicalNode = null;
                        if(node.type === 'paragraph') {
                            parentNode = $createParagraphNode();
                        }
                        else if(node.type === 'text') {
                            parentNode = $createTextNode((node as SerializedTextNode).text);
                            (parentNode as TextNode).setFormat((node as SerializedTextNode).format);
                        }
                        else if(node.type === 'link') {
                            parentNode = $createLinkNode({
                                fields: (node as SerializedLinkNode).fields
                            });
                        }
                        if("children" in node) {
                            (node.children as SerializedLexicalNode[]).forEach(child => {
                                (parentNode as ParagraphNode | LinkNode).append(dfs(child));
                            })
                        }
                        return parentNode;
                    }
                    const immutableTextNodes = $nodesOfType(ImmutableTextNode);
                    if(immutableTextNodes.length === 0) return;
                    const footerNodes = $nodesOfType(SuperscriptFooterNode);
                    if(footerNodes.length > 0) {
                        footerNodes[0].remove();
                    }
                    const newFooter = $createSuperscriptFooterNode();
                    let number = 1;
                    const len = immutableTextNodes.length;
                    for(let i = 0; i < len; i++) {
                        const node = immutableTextNodes[i];
                        node.setTextContent(number.toString());
                        number += 1;
                        const parent = node.getParent();
                        if($isCustomSuperscriptLinkNode(parent)) {
                            const oldFields = parent.getFields();
                            parent.setFields({
                                ...oldFields,
                                url: `#footer-${number - 1}`,
                            })
                            console.log({fields: parent.__fields})
                            const newListItem = $createListItemNode(false);
                            const fields: LinkFields & { content?: { root?: { children: SerializedParagraphNode[] } } } = parent.getFields();
                            console.log(fields);
                            if("content" in fields) {
                                const getLexicalFieldNodesJSON = fields.content;
                                console.log(parent.getFields().content);
                                // dfs the children
                                if("root" in getLexicalFieldNodesJSON) {
                                    const paragraphs = getLexicalFieldNodesJSON.root.children as SerializedParagraphNode[]
                                    paragraphs.forEach(paragraph => {
                                        newListItem.append(dfs(paragraph));
                                    })
                                }
                                // its safe to assume for this use case that all nodes under root will be paragraph nodes
                            }
                            newFooter.append(newListItem);
                        }
                    }
                    const paraNodes = $nodesOfType(ParagraphNode);
                    const root = paraNodes[0].getParent();
                    root.append(newFooter);
                    //create a footer node if it doesn't exist
                });
                return false;
            }, COMMAND_PRIORITY_LOW),

            editor.registerCommand(KEY_BACKSPACE_COMMAND, (event) => {
                return true;
            }, COMMAND_PRIORITY_LOW)
        );
    }, [editor])
    return null;
}