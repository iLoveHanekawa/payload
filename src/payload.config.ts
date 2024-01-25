import path from 'path'

import { payloadCloud } from '@payloadcms/plugin-cloud'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { slateEditor } from '@payloadcms/richtext-slate'
import { MarkFeature } from './features/mark'
import { viteBundler } from '@payloadcms/bundler-vite'
import { buildConfig } from 'payload/config'
import { AlignFeature, BoldTextFeature, HTMLConverterFeature, HeadingFeature, IndentFeature, InlineCodeTextFeature, ItalicTextFeature, LinkFeature, StrikethroughTextFeature, SubscriptTextFeature, SuperscriptTextFeature, TreeViewFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import Users from './collections/Users'
import Posts from './collections/Posts'

export default buildConfig({
  admin: {
    user: Users.slug,
    bundler: viteBundler(),
  },
  editor: lexicalEditor({
    features: (({ defaultFeatures }) => {
      return [
        HeadingFeature({}),
        AlignFeature(),
        IndentFeature(),
        BoldTextFeature(),
        TreeViewFeature(),
        ItalicTextFeature(),
        StrikethroughTextFeature(),
        MarkFeature(),
        HTMLConverterFeature(({converters({ defaultConverters }) {
          return [...defaultConverters]
        },})),
        SubscriptTextFeature(),
        SuperscriptTextFeature(),
        InlineCodeTextFeature(),
        LinkFeature({})
      ]
    })
  }),
  collections: [Users, Posts],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  plugins: [payloadCloud()],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
})
