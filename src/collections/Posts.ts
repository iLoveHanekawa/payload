import { AlignFeature, BoldTextFeature, HTMLConverterFeature, HeadingFeature, IndentFeature, InlineCodeTextFeature, ItalicTextFeature, LinkFeature, OrderedListFeature, StrikethroughTextFeature, SubscriptTextFeature, TreeViewFeature, UnderlineTextFeature, UnorderedListFeature, lexicalEditor, lexicalHTML } from '@payloadcms/richtext-lexical';
import { CollectionConfig } from 'payload/types'
import { MarkFeature } from '../features/mark';
import { markHTMLConverter } from '../features/mark/MarkHTMLConverter';
import { CustomSuperscriptFeature } from '../features/superscript';

const Posts: CollectionConfig = {
    slug: "posts",
    fields: [
        {
            name: 'title',
            type: 'text',
            label: 'Title'
        },
        {
            name: 'content',
            type: 'richText',
            label: 'Content',
            editor: lexicalEditor({
                features: ({ defaultFeatures }) => {
                    return [
                        // ...defaultFeatures,
                        HeadingFeature({}),
                        AlignFeature(),
                        IndentFeature(),
                        BoldTextFeature(),
                        ItalicTextFeature(),
                        UnderlineTextFeature(),
                        // MarkFeature(),
                        StrikethroughTextFeature(),
                        CustomSuperscriptFeature(),
                        // SubscriptTextFeature(),
                        InlineCodeTextFeature(),
                        LinkFeature({}),
                        // MarkFeature(),
                        HTMLConverterFeature({converters({ defaultConverters }) {
                            return [...defaultConverters, markHTMLConverter]
                        },}),
                        TreeViewFeature(),
                        
                    ]
                }
            })
        },
        lexicalHTML('content', { name: 'content_html' })
    ],
}

export default Posts;