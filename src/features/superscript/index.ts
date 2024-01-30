import { BoldTextFeature, FeatureProvider, HTMLConverterFeature, ItalicTextFeature, LinkFeature, LinkNode, ParagraphFeature, StrikethroughTextFeature, TextHTMLConverter, lexicalEditor } from "@payloadcms/richtext-lexical";
import { SectionWithEntries } from "@payloadcms/richtext-lexical/dist/field/features/format/common/floatingSelectToolbarSection";
import ImmutableTextNode from "./CustomSuperscript";
import { LinkFeatureProps } from "@payloadcms/richtext-lexical";
import { PUSH_CUSTOM_SUPERSCRIPT_NODE } from "./CustomSuperscript";
import { CustomSuperscriptLinkNode } from "./nodes/CustomSuperscriptLinkNode";
import { ListNode, ListItemNode } from '@lexical/list'
import { ParagraphHTMLConverter } from "@payloadcms/richtext-lexical";
import { CustomSuperscriptHTMLConverter } from "./CustomSuperscriptHTMLConverter";
import { CustomSuperscriptHTMLLinkConverter } from "./CustomSuperscriptHTMLLinkConverter";
import { SuperscriptFooterNode } from "./nodes/FooterNode";
import { superscriptFooterHTMLConverter } from "./superscriptFooterHTMLConverter";
import { CustomLinkItemHTMLConverter } from "./CustomLinkItemHTMLConverter";


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
                    {
                        Component: async() => {
                            return import('./plugins/SuperscriptFooterPlugin').then(module => {
                                return module.SuperscriptFooterPlugin;
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
                                order: 6,
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
                        // populationPromises: [customSuperscriptLinkPopulationPromiseHOC(customSuperscriptFeatureEditorFields)]
                    },
                    {
                        converters: {
                            html: superscriptFooterHTMLConverter
                        },
                        node: SuperscriptFooterNode,
                        type: SuperscriptFooterNode.getType()
                    },
                    {
                        converters: {
                            html: CustomLinkItemHTMLConverter
                        },
                        node: ListItemNode,
                        type: ListItemNode.getType()
                    },
                    {
                        // converters: {
                        //     html: null
                        // },
                        node: ListNode,
                        type: ListNode.getType()
                    }
                ],
                props: null
            }
        },
        key: 'customSuperscript'
    }
}