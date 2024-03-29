import type { BaseSelection } from 'lexical'
import { $createTextNode } from 'lexical'
import { addClassNamesToElement, isHTMLAnchorElement } from '@lexical/utils'
import { type LinkPayload } from '@payloadcms/richtext-lexical/dist/field/features/Link/plugins/floatingLinkEditor/types';

import {
  $applyNodeReplacement,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  type DOMConversionMap,
  type DOMConversionOutput,
  type EditorConfig,
  ElementNode,
  type LexicalCommand,
  type LexicalNode,
  type NodeKey,
  type RangeSelection,
  type SerializedElementNode,
  type Spread,
  createCommand,
} from 'lexical'
import { $createImmutableTextNode } from '../CustomSuperscript';

export type CustomSuperscriptLinkPayload = LinkPayload

export type CustomSuperscriptLinkFields = {
  // unknown, custom fields:
  [key: string]: unknown
  doc: {
    relationTo: string
    value:
      | {
          // Actual doc data, populated in afterRead hook
          [key: string]: unknown
          id: string
        }
      | string
  } | null
  linkType: 'custom' | 'internal'
  newTab: boolean
  url: string
}

export type CustomSuperscriptSerializedLinkNode = Spread<
  {
    fields: CustomSuperscriptLinkFields
  },
  SerializedElementNode
>

const SUPPORTED_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'sms:', 'tel:', '#'])

/** @noInheritDoc */
export class CustomSuperscriptLinkNode extends ElementNode {
  __fields: CustomSuperscriptLinkFields

  constructor({
    fields = {
      doc: null,
      linkType: 'custom',
      newTab: false,
      url: undefined,
    },
    key,
  }: {
    fields: CustomSuperscriptLinkFields
    key?: NodeKey
  }) {
    super(key)
    this.__fields = fields
  }

  static clone(node: CustomSuperscriptLinkNode): CustomSuperscriptLinkNode {
    return new CustomSuperscriptLinkNode({
      fields: node.__fields,
      key: node.__key,
    })
  }

  static getType(): string {
    return 'customSuperscriptLink'
  }

  static importDOM(): DOMConversionMap | null {
    return {
      a: (node: Node) => ({
        conversion: convertAnchorElement,
        priority: 1,
      }),
    }
  }

  static importJSON(serializedNode: CustomSuperscriptSerializedLinkNode): CustomSuperscriptLinkNode {
    if (
      serializedNode.version === 1 &&
      typeof serializedNode.fields?.doc?.value === 'object' &&
      serializedNode.fields?.doc?.value?.id
    ) {
      serializedNode.fields.doc.value = serializedNode.fields.doc.value.id
      serializedNode.version = 2
    }

    const node = $createCustomSuperscriptLinkNode({
      fields: serializedNode.fields,
    })
    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  canBeEmpty(): false {
    return false
  }

  canInsertTextAfter(): false {
    return false
  }

  canInsertTextBefore(): false {
    return false
  }

  createDOM(config: EditorConfig): HTMLAnchorElement {
    const element = document.createElement('a')
    if (this.__fields?.linkType === 'custom') {
      // no need to sanitize url that we add ourselves
      // element.href = this.__fields.url;
      // console.log({url: this.__fields.url});
      element.href = this.sanitizeUrl(this.__fields.url ?? '')
    }
    if (this.__fields?.newTab ?? false) {
      element.target = '_blank'
    }

    if (this.__fields?.newTab === true && this.__fields?.linkType === 'custom') {
      element.rel = manageRel(element.rel, 'add', 'noopener')
    }

    addClassNamesToElement(element, config.theme.link)
    return element
  }

  exportJSON(): CustomSuperscriptSerializedLinkNode {
    return {
      ...super.exportJSON(),
      fields: this.getFields(),
      type: this.getType(),
      version: 2,
    }
  }

  extractWithChild(
    child: LexicalNode,
    selection: BaseSelection,
    destination: 'clone' | 'html',
  ): boolean {
    if (!$isRangeSelection(selection)) {
      return false
    }

    const anchorNode = selection.anchor.getNode()
    const focusNode = selection.focus.getNode()

    return (
      this.isParentOf(anchorNode) &&
      this.isParentOf(focusNode) &&
      selection.getTextContent().length > 0
    )
  }

  getFields(): CustomSuperscriptLinkFields {
    return this.getLatest().__fields
  }

  insertNewAfter(selection: RangeSelection, restoreSelection = true): ElementNode | null {
    const element = this.getParentOrThrow().insertNewAfter(selection, restoreSelection)
    if ($isElementNode(element)) {
      const linkNode = $createCustomSuperscriptLinkNode({ fields: this.__fields })
      element.append(linkNode)
      return linkNode
    }
    return null
  }

  isInline(): true {
    return true
  }

  sanitizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url)
      // eslint-disable-next-line no-script-url
      if (!SUPPORTED_URL_PROTOCOLS.has(parsedUrl.protocol)) {
        return 'about:blank'
      }
    } catch (e) {
      return 'https://'
    }
    return url
  }

  setFields(fields: CustomSuperscriptLinkFields): void {
    const writable = this.getWritable()
    // console.log({ writable });
    // console.log({ setFieldsFields: fields});
    writable.__fields = fields
  }

  updateDOM(prevNode: CustomSuperscriptLinkNode, anchor: HTMLAnchorElement, config: EditorConfig): boolean {
    const url = this.__fields?.url
    const newTab = this.__fields?.newTab
    if (url != null && url !== prevNode.__fields?.url && this.__fields?.linkType === 'custom') {
      anchor.href = url
    }
    if (this.__fields?.linkType === 'internal' && prevNode.__fields?.linkType === 'custom') {
      anchor.removeAttribute('href')
    }

    // TODO: not 100% sure why we're settign rel to '' - revisit
    // Start rel config here, then check newTab below
    if (anchor.rel == null) {
      anchor.rel = ''
    }

    if (newTab !== prevNode.__fields?.newTab) {
      if (newTab ?? false) {
        anchor.target = '_blank'
        if (this.__fields?.linkType === 'custom') {
          anchor.rel = manageRel(anchor.rel, 'add', 'noopener')
        }
      } else {
        anchor.removeAttribute('target')
        anchor.rel = manageRel(anchor.rel, 'remove', 'noopener')
      }
    }
    return false
  }
}

function convertAnchorElement(domNode: Node): DOMConversionOutput {
  let node: CustomSuperscriptLinkNode | null = null
  if (isHTMLAnchorElement(domNode)) {
    const content = domNode.textContent
    if (content !== null && content !== '') {
      node = $createCustomSuperscriptLinkNode({
        fields: {
          doc: null,
          linkType: 'custom',
          newTab: domNode.getAttribute('target') === '_blank',
          url: domNode.getAttribute('href') ?? '',
        },
      })
    }
  }
  return { node }
}

export function $createCustomSuperscriptLinkNode({ fields }: { fields: CustomSuperscriptLinkFields }): CustomSuperscriptLinkNode {
  return $applyNodeReplacement(new CustomSuperscriptLinkNode({ fields }))
}

export function $isCustomSuperscriptLinkNode(node: LexicalNode | null | undefined): node is CustomSuperscriptLinkNode {
  return node instanceof CustomSuperscriptLinkNode
}

export const TOGGLE_CUSTOM_SUPERSCRIPT_LINK_COMMAND: LexicalCommand<CustomSuperscriptLinkPayload | null> =
  createCommand('TOGGLE_CUSTOM_SUPERSCRIPT_LINK_COMMAND')

export function toggleCustomSuperscriptLink(payload: LinkPayload): void {
  const selection = $getSelection()
  
  // console.log({ payload, selection });

  if(!$isRangeSelection(selection)) {
    return;
  }

  if (payload === null) {
    // console.log('in null');
    const nodes = selection.extract()
    // Remove LinkNodes
    nodes.forEach((node) => {
      const parent = node.getParent()

      if ($isCustomSuperscriptLinkNode(parent)) {
        // const children = parent.getChildren()

        // for (let i = 0; i < children.length; i += 1) {
        //   parent.insertBefore(children[i])
        // }

        parent.remove()
      }
    })
  } else { 
    // if (!$isRangeSelection(selection)) {
    //   return
    // }
    // console.log('in else');
    const nodes = selection.getNodes();
    if (nodes.length === 1) {
      // console.log('one node');
      const firstNode = nodes[0]
      // if the first node is a LinkNode or if its
      // parent is a LinkNode, we update the URL, target and rel.
      const linkNode: CustomSuperscriptLinkNode | null = $isCustomSuperscriptLinkNode(firstNode)
        ? firstNode
        : $getCustomSuperscriptLinkAncestor(firstNode)
      if (linkNode !== null) {
        // console.log('target area');
        // console.log({ linkNodeBefore: linkNode })
        linkNode.setFields(payload.fields)
        // console.log({ linkNodeAfter: linkNode })
        if (payload.text != null && payload.text !== linkNode.getTextContent()) {
          // remove all children and add child with new textcontent:
          linkNode.append($createImmutableTextNode(payload.text))
          linkNode.getChildren().forEach((child) => {
            if (child !== linkNode.getLastChild()) {
              child.remove()
            }
          })
        }
        return
      }
    }
  
    let prevParent: ElementNode | CustomSuperscriptLinkNode | null = null
    let linkNode: CustomSuperscriptLinkNode | null = null
  
    nodes.forEach((node) => {
      const parent = node.getParent()
  
      if (parent === linkNode || parent === null || ($isElementNode(node) && !node.isInline())) {
        return
      }
  
      if ($isCustomSuperscriptLinkNode(parent)) {
        linkNode = parent
        parent.setFields(payload.fields)
        if (payload.text != null && payload.text !== parent.getTextContent()) {
          // remove all children and add child with new textcontent:
          parent.append($createImmutableTextNode(payload.text))
          parent.getChildren().forEach((child) => {
            if (child !== parent.getLastChild()) {
              child.remove()
            }
          })
        }
        return
      }
  
      if (!parent.is(prevParent)) {
        prevParent = parent
        linkNode = $createCustomSuperscriptLinkNode({ fields: payload.fields })
  
        if ($isCustomSuperscriptLinkNode(parent)) {
          if (node.getPreviousSibling() === null) {
            parent.insertBefore(linkNode)
          } else {
            parent.insertAfter(linkNode)
          }
        } else {
          node.insertBefore(linkNode)
        }
      }
  
      if ($isCustomSuperscriptLinkNode(node)) {
        if (node.is(linkNode)) {
          return
        }
        if (linkNode !== null) {
          const children = node.getChildren()
  
          for (let i = 0; i < children.length; i += 1) {
            linkNode.append(children[i])
          }
        }
  
        node.remove()
        return
      }
  
      if (linkNode !== null) {
        linkNode.append(node)
        const nextSibling = linkNode.getNextSibling()
        if(nextSibling === null) {
          const hackTextNode = $createTextNode(' ');
          linkNode.insertAfter(hackTextNode);
        }
      }
    })
  }
}

export function $getCustomSuperscriptLinkAncestor(node: LexicalNode): CustomSuperscriptLinkNode | null {
  return $getAncestor(node, (ancestor) => $isCustomSuperscriptLinkNode(ancestor)) as CustomSuperscriptLinkNode
}

function $getAncestor(
  node: LexicalNode,
  predicate: (ancestor: LexicalNode) => boolean,
): LexicalNode | null {
  let parent: LexicalNode | null = node
  while (parent !== null && (parent = parent.getParent()) !== null && !predicate(parent));
  return parent
}

function manageRel(input: string, action: 'add' | 'remove', value: string): string {
  let result: string
  let mutableInput = `${input}`
  if (action === 'add') {
    // if we somehow got out of sync - clean up
    if (mutableInput.includes(value)) {
      const re = new RegExp(value, 'g')
      mutableInput = mutableInput.replace(re, '').trim()
    }
    mutableInput = mutableInput.trim()
    result = mutableInput.length === 0 ? `${value}` : `${mutableInput} ${value}`
  } else {
    const re = new RegExp(value, 'g')
    result = mutableInput.replace(re, '').trim()
  }
  return result
}