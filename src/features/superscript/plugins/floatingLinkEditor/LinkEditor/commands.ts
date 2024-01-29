import type { LexicalCommand } from 'lexical'

import { createCommand } from 'lexical'

import { CustomSuperscriptLinkPayload } from '../../../nodes/CustomSuperscriptLinkNode'

export const TOGGLE_CUSTOM_SUPERSCRIPT_LINK_WITH_MODAL_COMMAND: LexicalCommand<CustomSuperscriptLinkPayload | null> = createCommand(
  'TOGGLE_CUSTOM_SUPERSCRIPT_LINK_WITH_MODAL_COMMAND',
)
