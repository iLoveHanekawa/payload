import { BoldTextFeature, HTMLConverterFeature, HeadingFeature, InlineCodeTextFeature, TreeViewFeature, lexicalEditor, lexicalHTML } from '@payloadcms/richtext-lexical';
import { CollectionConfig } from 'payload/types'
import { MarkFeature } from '../features/mark';

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
                        InlineCodeTextFeature(),
                        HTMLConverterFeature({}),
                        TreeViewFeature(),
                        MarkFeature()
                    ]
                }
            })
        },
        lexicalHTML('content', { name: 'content_html' })
    ],
}

export default Posts;