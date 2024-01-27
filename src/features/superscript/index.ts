import { FeatureProvider } from "@payloadcms/richtext-lexical";
import { SectionWithEntries } from "@payloadcms/richtext-lexical/dist/field/features/format/common/floatingSelectToolbarSection";
import ImmutableTextNode from "./CustomSuperscript";
import { PUSH_CUSTOM_SUPERSCRIPT_NODE } from "./CustomSuperscript";

export const CustomSuperscriptFeature = (): FeatureProvider => {
    return {
        feature: () => {
            return {
                plugins: [{
                    Component: async () => {
                        return import('./CustomSuperscript').then(module => {
                            return module.ImmutableTextNodePlugin;
                        })
                    },
                    position: 'normal'
                }],
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
                                    if(!isActive) {
                                    }
                                    else {

                                    }
                                },
                                order: 1
                            }
                        ])
                    ]
                },
                nodes: [
                    {
                        node: ImmutableTextNode,
                        type: ImmutableTextNode.getType()
                    }
                ],
                props: null
            }
        },
        key: 'customSuperscript'
    }
}