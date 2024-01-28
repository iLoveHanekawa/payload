'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
  FORMAT_TEXT_COMMAND,
} from 'lexical'
import { useEffect } from 'react'

import { CustomSuperscriptLinkPayload } from '../nodes/CustomSuperscriptLinkNode'
import { validateUrl } from '../utils/url'
import { type CustomSuperscriptLinkFields, CustomSuperscriptLinkNode, TOGGLE_CUSTOM_SUPERSCRIPT_LINK_COMMAND } from '../nodes/CustomSuperscriptLinkNode'
import { toggleCustomSuperscriptLink } from '../nodes/CustomSuperscriptLinkNode'
import { RESOLVE_CUSTOM_SUPERSCRIPT_NODE_COUNT } from '../CustomSuperscript'

export function CustomSuperscriptLinkPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([CustomSuperscriptLinkNode])) {
      throw new Error('CustomSuperscriptLinkPlugin: CustomSuperscriptLinkNode not registered on editor')
    }
    return mergeRegister(
      editor.registerCommand(
        TOGGLE_CUSTOM_SUPERSCRIPT_LINK_COMMAND,
        (payload: CustomSuperscriptLinkPayload) => {
          // validate
          if (payload?.fields.linkType === 'custom') {
            if (!(validateUrl === undefined || validateUrl(payload?.fields.url))) {
              return false
            }
          }
          if(payload === null) {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
          }
          toggleCustomSuperscriptLink(payload)
          editor.dispatchCommand(RESOLVE_CUSTOM_SUPERSCRIPT_NODE_COUNT, null);
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      validateUrl !== undefined
        ? editor.registerCommand(
            PASTE_COMMAND,
            (event) => {
              const selection = $getSelection()
              if (
                !$isRangeSelection(selection) ||
                selection.isCollapsed() ||
                !(event instanceof ClipboardEvent) ||
                event.clipboardData == null
              ) {
                return false
              }
              const clipboardText = event.clipboardData.getData('text')
              if (!validateUrl(clipboardText)) {
                return false
              }
              // If we select nodes that are elements then avoid applying the link.
              if (!selection.getNodes().some((node) => $isElementNode(node))) {
                const linkFields: CustomSuperscriptLinkFields = {
                  doc: null,
                  linkType: 'custom',
                  newTab: false,
                  url: clipboardText,
                }
                editor.dispatchCommand(TOGGLE_CUSTOM_SUPERSCRIPT_LINK_COMMAND, {
                  fields: linkFields,
                  text: null,
                })
                event.preventDefault()
                return true
              }
              return false
            },
            COMMAND_PRIORITY_LOW,
          )
        : () => {
            // Don't paste arbitrary text as a link when there's no validate function
          },
    )
  }, [editor])

  return null
}