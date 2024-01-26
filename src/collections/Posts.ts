import { BoldTextFeature, HTMLConverterFeature, HeadingFeature, InlineCodeTextFeature, LinkFeature, OrderedListFeature, TreeViewFeature, UnorderedListFeature, lexicalEditor, lexicalHTML } from '@payloadcms/richtext-lexical';
import { CollectionConfig } from 'payload/types'
import { MarkFeature } from '../features/mark';
import { markHTMLConverter } from '../features/mark/MarkHTMLConverter';

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
                        BoldTextFeature(),
                        LinkFeature({}),
                        InlineCodeTextFeature(),
                        HTMLConverterFeature({converters({ defaultConverters }) {
                            return [...defaultConverters, markHTMLConverter]
                        },}),
                        TreeViewFeature(),
                        MarkFeature(),
                        HeadingFeature({}),
                        OrderedListFeature(),
                        UnorderedListFeature()
                    ]
                }
            })
        },
        lexicalHTML('content', { name: 'content_html' })
    ],
}

export default Posts;