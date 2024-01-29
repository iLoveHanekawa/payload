import { AutoLinkNode, BoldTextFeature, FeatureProvider, HTMLConverterFeature, ItalicTextFeature, LinkFeature, LinkNode, ParagraphFeature, StrikethroughTextFeature, TextHTMLConverter, lexicalEditor } from "@payloadcms/richtext-lexical";
import { SectionWithEntries } from "@payloadcms/richtext-lexical/dist/field/features/format/common/floatingSelectToolbarSection";
import ImmutableTextNode from "./CustomSuperscript";
import { LinkFeatureProps, lexicalHTML } from "@payloadcms/richtext-lexical";
import { PUSH_CUSTOM_SUPERSCRIPT_NODE, RESOLVE_CUSTOM_SUPERSCRIPT_NODE_COUNT } from "./CustomSuperscript";
import { LinkPayload } from '@payloadcms/richtext-lexical/dist/field/features/Link/plugins/floatingLinkEditor/types';
import { CustomSuperscriptLinkNode, TOGGLE_CUSTOM_SUPERSCRIPT_LINK_COMMAND } from "./nodes/CustomSuperscriptLinkNode";
import { TOGGLE_CUSTOM_SUPERSCRIPT_LINK_WITH_MODAL_COMMAND } from "./plugins/floatingLinkEditor/LinkEditor/commands";
import { $getSelection, KEY_BACKSPACE_COMMAND } from 'lexical'
import { ParagraphHTMLConverter, defaultHTMLConverters } from "@payloadcms/richtext-lexical";
import { customSuperscriptLinkPopulationPromiseHOC } from "./populationPromise";
import { CustomSuperscriptHTMLConverter } from "./CustomSuperscriptHTMLConverter";
import { CustomSuperscriptHTMLLinkConverter } from "./CustomSuperscriptHTMLLinkConverter";


export const CustomSuperscriptFeature = (): FeatureProvider => {
    const customSuperscriptFeatureEditorFields: LinkFeatureProps = {
        fields: [
            {
                name: 'content',
                label: 'Content',
                required: true,
                type: 'richText',
                editor: lexicalEditor({
                    features: ({ defaultFeatures }) => {
                        return [
                            // ...defaultFeatures,
                            ParagraphFeature(),
                            ItalicTextFeature(),
                            BoldTextFeature(),
                            StrikethroughTextFeature(),
                            LinkFeature({}),
                            HTMLConverterFeature({
                                converters: [ParagraphHTMLConverter, TextHTMLConverter]
                            })
                        ]
                    }
                })
            },
        ]
    }
    return {
        feature: () => {
            return {
                plugins: [
                    {
                        Component: async () => {
                            return import('./CustomSuperscript').then(module => {
                                return module.ImmutableTextNodePlugin;
                            })
                        },
                        position: 'normal'
                    },
                    // {
                    //     Component: async () => {
                    //         return import('@payloadcms/richtext-lexical/dist/field/features/Link/plugins/clickableLink').then(module => module.ClickableLinkPlugin)
                    //     },
                    //     position: 'normal'
                    // },
                    {
                        Component: async () => {
                            return import('./plugins/CustomSuperscriptLinkPlugin').then(module => module.CustomSuperscriptLinkPlugin)
                        },
                        position: 'normal'
                    },
                    {
                        Component: async () => {
                            return import('./plugins/floatingLinkEditor').then(async (module) => {
                                const floatingLinkEditorPlugin = module.FloatingLinkEditorPlugin
                                return import('payload/utilities').then((module) =>
                                    module.withMergedProps({
                                        Component: floatingLinkEditorPlugin,
                                        toMergeIntoProps: customSuperscriptFeatureEditorFields,
                                    }),
                                )
                            })
                        },
                        position: 'floatingAnchorElem'
                    }
                ],
                floatingSelectToolbar: {
                    sections: [
                        SectionWithEntries([
                            {
                                ChildComponent: () => import('./CustomSuperscriptIcon').then((module) => module.CustomSuperscriptIcon),
                                isActive: ({ selection, editor }) => {
                                    return false;
                                },
                                key: 'customSuperscript',
                                label: 'customSuperscript',
                                onClick: ({ editor, isActive }) => {
                                    editor.dispatchCommand(PUSH_CUSTOM_SUPERSCRIPT_NODE, null);
                                },
                                order: 1
                            }
                        ])
                    ]
                },
                nodes: [
                    {
                        converters: {
                            html: CustomSuperscriptHTMLConverter
                        },
                        node: ImmutableTextNode,
                        type: ImmutableTextNode.getType()
                    },
                    {
                        converters: {
                            html: CustomSuperscriptHTMLLinkConverter
                        },
                        node: CustomSuperscriptLinkNode,
                        type: CustomSuperscriptLinkNode.getType(),
                        populationPromises: [customSuperscriptLinkPopulationPromiseHOC(customSuperscriptFeatureEditorFields)]
                    }
                ],
                props: null
            }
        },
        key: 'customSuperscript'
    }
}