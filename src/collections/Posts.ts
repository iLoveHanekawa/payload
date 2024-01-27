import { BoldTextFeature, HTMLConverterFeature, HeadingFeature, InlineCodeTextFeature, LinkFeature, OrderedListFeature, TreeViewFeature, UnorderedListFeature, lexicalEditor, lexicalHTML } from '@payloadcms/richtext-lexical';
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
                        CustomSuperscriptFeature(),
                        LinkFeature({
                            fields: [{
                                name: 'Random',
                                type: 'richText'
                            }]
                        }),
                        MarkFeature(),
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