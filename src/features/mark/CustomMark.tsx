'use client'

import type { EditorConfig, LexicalEditor, NodeKey, LexicalNode, ElementFormatType } from "lexical";
import { ElementNode, createCommand, COMMAND_PRIORITY_LOW, $getSelection, $isRangeSelection, RangeSelection, $createParagraphNode, $applyNodeReplacement, $getTextContent} from "lexical";
import { ELEMENT_TYPE_TO_FORMAT } from "@payloadcms/richtext-lexical";
import { $sliceSelectedTextNodeContent, $setBlocksType } from '@lexical/selection'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { MarkNode } from "@lexical/mark";
import { SerializedLinkNode } from "@payloadcms/richtext-lexical";
import { useEffect } from "react";

export default class CustomMarkNode extends ElementNode {
    constructor(key?: NodeKey) {
        super(key);
    }

    static clone(node: CustomMarkNode): CustomMarkNode {
        return new CustomMarkNode(node.__key);
    }

    createDOM(_config: EditorConfig, _editor: LexicalEditor): HTMLElement {
        const element = document.createElement('mark');
        element.className = _config.theme.customMark;
        return element;
    }

    updateDOM(): false {
        return false;
    }
    
    static getType() {
        return 'customMark'
    }
    static importJSON(serializedNode) {
        const node = $createCustomMarkNode();
        node.setFormat();
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
      }
    exportJSON() {
    return {
        ...super.exportJSON(),
        type: 'customMark',
        version: 1
    };
    }

    collapseAtStart(selection: RangeSelection): boolean {
        const paragraph = $createParagraphNode();
        const children = this.getChildren();
        children.forEach(child => paragraph.append(child));
        this.replace(paragraph);
        return true;
    }

    insertNewAfter(selection: RangeSelection, restoreSelection?: boolean | undefined): LexicalNode | null {
        const newBlock =  $createParagraphNode();
        const direction = this.getDirection();
        newBlock.setDirection(direction);
        this.insertAfter(newBlock, restoreSelection);
        return newBlock;
    }

    hasFormat(type: ElementFormatType): boolean {
        if (type !== '') {
          const formatFlag = ELEMENT_TYPE_TO_FORMAT[type];
          return (this.getFormat() & formatFlag) !== 0;
        }
        return false;
    }

    setFormat() {
        return this;
    }
        isParentRequired() {
        return true;
    }
    createParentElementNode() {
        return $createCustomMarkNode();
    }
}

export function $createCustomMarkNode(): CustomMarkNode {
    return $applyNodeReplacement(new CustomMarkNode());
}

export function $isCustomMarkNode(node: LexicalNode): node is CustomMarkNode {
    return node instanceof CustomMarkNode;
}

export const INSERT_CUSTOMMARK_COMMAND = createCommand('insertCustomMarkNode');

export function CustomMarkPlugin(): null {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        if(!editor.hasNodes([CustomMarkNode])) {
            throw new Error("CustomMarkPlugin: CustomMarkPlugin is not registered on the editor")
        }
        editor.registerCommand(INSERT_CUSTOMMARK_COMMAND, () => {
            const selection = $getSelection();
            const nodes = selection.getNodes();
            if($isRangeSelection(selection)) {
                console.log(selection);
                console.log(nodes);
                // $setBlocksType(selection, $createCustomMarkNode);
            }
            return true;
        }, COMMAND_PRIORITY_LOW);
    
    }, [editor])
    return null;
}