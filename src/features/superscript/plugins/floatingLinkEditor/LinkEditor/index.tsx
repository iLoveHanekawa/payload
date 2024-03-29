'use client'
import type { Data, Fields } from 'payload/types'
import { EditorConfig, LexicalRichTextAdapter, defaultEditorConfig, defaultEditorFeatures, type SanitizedEditorConfig } from '@payloadcms/richtext-lexical'
import { useModal } from '@faceless-ui/modal'
import { ResolvedFeatureMap, sanitizeEditorConfig } from '@payloadcms/richtext-lexical'
import {  } from 'lexical'
import RichText from 'payload/dist/admin/components/forms/field-types/RichText'
import {} from '@lexical/utils'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_ESCAPE_COMMAND,
  SerializedEditorState,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { formatDrawerSlug } from 'payload/components/elements'
import {
  buildStateFromSchema,
  useAuth,
  useConfig,
  useDocumentInfo,
  useEditDepth,
  useLocale,
} from 'payload/components/utilities'
import { sanitizeFields } from './sanitize'
import { getTranslation } from 'payload/utilities'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CustomSuperscriptLinkNode, $isCustomSuperscriptLinkNode, TOGGLE_CUSTOM_SUPERSCRIPT_LINK_COMMAND } from '../../../nodes/CustomSuperscriptLinkNode'
import { CustomSuperscriptLinkPayload } from '../../../nodes/CustomSuperscriptLinkNode'
import { LinkFeatureProps, consolidateHTMLConverters, convertLexicalNodesToHTML, convertLexicalToHTML } from "@payloadcms/richtext-lexical";


import { useEditorConfigContext } from '@payloadcms/richtext-lexical/dist/field/lexical/config/EditorConfigProvider'
import { getSelectedNode } from '@payloadcms/richtext-lexical'
import { setFloatingElemPositionForLinkEditor } from '@payloadcms/richtext-lexical/dist/field/lexical/utils/setFloatingElemPositionForLinkEditor'
import { LinkDrawer } from '../../../drawer'
import { transformExtraFields } from '../utilities'
import { TOGGLE_CUSTOM_SUPERSCRIPT_LINK_WITH_MODAL_COMMAND } from './commands'
import { ElementNode } from '@payloadcms/richtext-slate'
import { CustomSuperscriptFeature } from '../../..'

export function LinkEditor({
  anchorElem,
  disabledCollections,
  enabledCollections,
  fields: customFieldSchema,
}: { anchorElem: HTMLElement } & LinkFeatureProps): JSX.Element {
  const [adapter, setadapter] = useState<LexicalRichTextAdapter | null>(null);

  const [editor] = useLexicalComposerContext()
  const [preview, setPreview] = React.useState<string>('');

  const editorRef = useRef<HTMLDivElement | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('')

  const { uuid } = useEditorConfigContext()

  const config = useConfig()

  const { user } = useAuth()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation(['fields', 'upload', 'general'])

  const { getDocPreferences } = useDocumentInfo()

  const [initialState, setInitialState] = useState<Fields>({})
  const [fieldSchema] = useState(() => {
    const fieldsUnsanitized = transformExtraFields(
      customFieldSchema,
      config,
      i18n,
      enabledCollections,
      disabledCollections,
    )
    // Sanitize custom fields here
    const validRelationships = config.collections.map((c) => c.slug) || []
    const fields = sanitizeFields({
      config: config,
      fields: fieldsUnsanitized,
      validRelationships,
    })

    return fields
  })


  const { closeModal, toggleModal } = useModal()
  const editDepth = useEditDepth()
  const [isLink, setIsLink] = useState(false)

  const drawerSlug = formatDrawerSlug({
    depth: editDepth,
    slug: `lexical-rich-text-custom-superscript-link-` + uuid,
  })  

  const updateLinkEditor = useCallback(async () => {
    const selection = $getSelection()
    let selectedNodeDomRect: DOMRect | undefined = null

    // Handle the data displayed in the floating link editor & drawer when you click on a link node
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection)
      selectedNodeDomRect = editor.getElementByKey(node.getKey())?.getBoundingClientRect()
      const linkParent: CustomSuperscriptLinkNode = $findMatchingParent(node, $isCustomSuperscriptLinkNode) as CustomSuperscriptLinkNode
      if (linkParent == null) {
        setIsLink(false)
        setPreview('')
        setLinkUrl('')
        setLinkLabel('')
        return
      }

      // Initial state:
      const data: CustomSuperscriptLinkPayload = {
        fields: {
          doc: undefined,
          linkType: undefined,
          newTab: undefined,
          url: '',
          ...linkParent.getFields(),
        },
        text: linkParent.getTextContent(),
      }


      if (linkParent.getFields()?.linkType === 'custom') {
        setLinkUrl(linkParent.getFields()?.url ?? '')
        setLinkLabel('')
      } else {
        // internal link
        setLinkUrl(
          `/admin/collections/${linkParent.getFields()?.doc?.relationTo}/${linkParent.getFields()
            ?.doc?.value}`,
        )

        const relatedField = config.collections.find(
          (coll) => coll.slug === linkParent.getFields()?.doc?.relationTo,
        )
        const label = t('fields:linkedTo', {
          label: getTranslation(relatedField.labels.singular, i18n),
        }).replace(/<[^>]*>?/g, '')
        setLinkLabel(label)
      }

      // Set initial state of the drawer. This will basically pre-fill the drawer fields with the
      // values saved in the link node you clicked on.
      const preferences = await getDocPreferences()
      const state = await buildStateFromSchema({
        config,
        data,
        fieldSchema,
        locale,
        operation: 'create',
        preferences,
        t,
        user: user ?? undefined,
      })
      setInitialState(state)
      setIsLink(true)
    }

    const editorElem = editorRef.current
    const nativeSelection = window.getSelection()
    const { activeElement } = document

    if (editorElem === null) {
      return
    }

    const rootElement = editor.getRootElement()

    if (
      selection !== null &&
      nativeSelection !== null &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      if (!selectedNodeDomRect) {
        // Get the DOM rect of the selected node using the native selection. This sometimes produces the wrong
        // result, which is why we use lexical's selection preferably.
        selectedNodeDomRect = nativeSelection.getRangeAt(0).getBoundingClientRect()
      }

      if (selectedNodeDomRect != null) {
        selectedNodeDomRect.y += 40
        setFloatingElemPositionForLinkEditor(selectedNodeDomRect, editorElem, anchorElem)
      }
    } else if (activeElement == null || activeElement.className !== 'link-input') {
      if (rootElement !== null) {
        setFloatingElemPositionForLinkEditor(null, editorElem, anchorElem)
      }
      setLinkUrl('')
      setLinkLabel('')
    }

    return true
  }, [anchorElem, editor, fieldSchema, config, getDocPreferences, locale, t, user, i18n])

  const editorState = editor.getEditorState();
  useEffect(() => {
    // name: 'Important'
    async function lexicaltToHTML(editorData: SerializedEditorState, editorConfig: EditorConfig) {
      const sanitizedConfig = sanitizeEditorConfig(editorConfig);
      const editorConfigForRender = await editorConfig.lexical();
      const lexEditor = lexicalEditor({ features: [...editorConfig.features, CustomSuperscriptFeature()], lexical: editorConfigForRender })
      
      setadapter(lexEditor);
      return await convertLexicalToHTML({
        converters: consolidateHTMLConverters({ editorConfig: sanitizedConfig }),
        data: editorData,
      })
    }
    async function readFromEditor() {
      await editorState.read(async () => {
        const selection = $getSelection()
        // Handle the data displayed in the floating link editor & drawer when you click on a link node
        if ($isRangeSelection(selection)) {
          const node = getSelectedNode(selection)
          const linkParent: CustomSuperscriptLinkNode = $findMatchingParent(node, $isCustomSuperscriptLinkNode) as CustomSuperscriptLinkNode
          // Initial state:
          if(linkParent && linkParent.getFields()?.content) {

            const res = linkParent.getFields()?.content as SerializedEditorState
            const editorConfig = defaultEditorConfig
            editorConfig.features = [
              ...defaultEditorFeatures,
            ]
            const html = await lexicaltToHTML(res, editorConfig)
            setPreview(html);
          }
        }
      })
    }
    readFromEditor();
  }, [editor, editorState])
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        TOGGLE_CUSTOM_SUPERSCRIPT_LINK_WITH_MODAL_COMMAND,
        (payload: CustomSuperscriptLinkPayload) => {
          editor.dispatchCommand(TOGGLE_CUSTOM_SUPERSCRIPT_LINK_COMMAND, payload)

          // Now, open the modal
          updateLinkEditor()
            .then(() => {
              toggleModal(drawerSlug)
            })
            .catch((error) => {
              throw error
            })
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, updateLinkEditor, toggleModal, drawerSlug])

  useEffect(() => {
    if (!isLink && editorRef) {
      editorRef.current.style.opacity = '0'
      editorRef.current.style.transform = 'translate(-10000px, -10000px)'
    }
  }, [isLink])

  

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement

    const update = (): void => {
      editor.getEditorState().read(() => {
        void updateLinkEditor()
      })
    }

    window.addEventListener('resize', update)

    if (scrollerElem != null) {
      scrollerElem.addEventListener('scroll', update)
    }

    return () => {
      window.removeEventListener('resize', update)

      if (scrollerElem != null) {
        scrollerElem.removeEventListener('scroll', update)
      }
    }
  }, [anchorElem.parentElement, editor, updateLinkEditor])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          void updateLinkEditor()
        })
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          void updateLinkEditor()
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (isLink) {
            setIsLink(false)
            return true
          }
          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),
    )
  }, [editor, updateLinkEditor, setIsLink, isLink])

  useEffect(() => {
    editor.getEditorState().read(() => {
      void updateLinkEditor()
    })
  }, [editor, updateLinkEditor])
  const sanitizedConfig = sanitizeEditorConfig(defaultEditorConfig);
  const lexical = defaultEditorConfig.lexical().then(value => {
    return value;
  });
  const lexicalEditorx = lexicalEditor({});
  return (
    <React.Fragment>
      <div className="link-editor" ref={editorRef}>
        <div className="link-input">
          <div className='dumb-crawler' dangerouslySetInnerHTML={{__html: preview}}></div>
          {/* {
            adapter &&
            <RichText  name='content' type='richText' editor={adapter} />
          } */}
          {editor.isEditable() && (
            <React.Fragment>
              <button
                aria-label="Edit link"
                className="link-edit"
                onClick={() => {
                  toggleModal(drawerSlug)
                }}
                onMouseDown={(event) => {
                  event.preventDefault()
                }}
                tabIndex={0}
                type="button"
              />
              <button
                aria-label="Remove link"
                className="link-trash"
                onClick={() => {
                  editor.dispatchCommand(TOGGLE_CUSTOM_SUPERSCRIPT_LINK_COMMAND, null)
                }}
                onMouseDown={(event) => {
                  event.preventDefault()
                }}
                tabIndex={0}
                type="button"
              />
            </React.Fragment>
          )}
        </div>
      </div>
      <LinkDrawer
        drawerSlug={drawerSlug}
        fieldSchema={fieldSchema}
        handleModalSubmit={(fields: Fields, data: Data) => {
          closeModal(drawerSlug)

          const newLinkPayload: CustomSuperscriptLinkPayload = data as CustomSuperscriptLinkPayload

          editor.dispatchCommand(TOGGLE_CUSTOM_SUPERSCRIPT_LINK_COMMAND, newLinkPayload)
        }}
        initialState={initialState}
      />
    </React.Fragment>
  )
}
