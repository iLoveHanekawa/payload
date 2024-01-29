import { ListNode, SerializedListNode, $createListItemNode, ListType } from '@lexical/list'
import { DOMConversionMap, isHTMLElement, DOMExportOutput, EditorConfig, LexicalEditor, type LexicalNode, $applyNodeReplacement } from 'lexical'

export class SuperscriptFooterNode extends ListNode {

    constructor(__listType: ListType = "bullet", __start: number = 0, __key?: string) {
        super(__listType, __start, __key);
    }

    static getType() {
        return 'superscriptFooter';
    }

    createDOM(config: EditorConfig, _editor?: LexicalEditor): HTMLElement {
        const superNode = super.createDOM(config);
        superNode.style.display = 'none';
        return superNode;
    }

    static importDOM(): DOMConversionMap {
        return {
            ol: node => ({
            conversion: convertListNode,
            priority: 0
            }),
            ul: node => ({
            conversion: convertListNode,
            priority: 0
            })
        };
    }

    exportJSON() {
        return {
            ...super.exportJSON(),
            listType: this.getListType(),
            start: this.getStart(),
            tag: this.getTag(),
            type: 'superscriptFooter',
            version: 1
        };
    }

    static clone(node: SuperscriptFooterNode) {
        return $createSuperscriptFooterNode(node.__listType, node.__start);
    }

    static importJSON(serializedNode: SerializedListNode): ListNode {
        const node = $createSuperscriptFooterNode(serializedNode.listType, serializedNode.start);
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    

    exportDOM(editor: LexicalEditor): DOMExportOutput {
        return super.exportDOM(editor);
    }
}

export const $createSuperscriptFooterNode = (listType: ListType = "bullet", start: number = 0): SuperscriptFooterNode => {
    return $applyNodeReplacement(new SuperscriptFooterNode(listType, start))
}

export const $isSuperscriptFooterNode = (node: LexicalNode): node is SuperscriptFooterNode => {
    return node instanceof SuperscriptFooterNode;
}



function convertListNode(domNode: Node) {
    const nodeName = domNode.nodeName.toLowerCase();
    let node = null;
    if (nodeName === 'ol') {
      // @ts-ignore
      const start = domNode.start;
      node = $createSuperscriptFooterNode('number', start);
    } else if (nodeName === 'ul') {
      if (isHTMLElement(domNode) && domNode.getAttribute('__lexicallisttype') === 'check') {
        node = $createSuperscriptFooterNode('check');
      } else {
        node = $createSuperscriptFooterNode('bullet');
      }
    }
    return {
      after: normalizeChildren,
      node
    };
  }

  function normalizeChildren(nodes: LexicalNode[]) {
    const normalizedListItems = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if ($isSuperscriptFooterNode(node)) {
        normalizedListItems.push(node);
        const children = node.getChildren();
        if (children.length > 1) {
          children.forEach(child => {
            if ($isSuperscriptFooterNode(child)) {
              normalizedListItems.push(wrapInListItem(child));
            }
          });
        }
      } else {
        normalizedListItems.push(wrapInListItem(node));
      }
    }
    return normalizedListItems;
  }

  function wrapInListItem(node: LexicalNode) {
    const listItemWrapper = $createListItemNode();
    return listItemWrapper.append(node);
  }
  