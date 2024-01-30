import path from 'path'

import { payloadCloud } from '@payloadcms/plugin-cloud'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { MarkFeature } from './features/mark'
import { viteBundler } from '@payloadcms/bundler-vite'
import { buildConfig } from 'payload/config'
import { HTMLConverterFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import Users from './collections/Users'
import Posts from './collections/Posts'
import { markHTMLConverter } from './features/mark/MarkHTMLConverter'

export default buildConfig({
  admin: {
    user: Users.slug,
    bundler: viteBundler(),
  },
  editor: lexicalEditor({
    features: (({ defaultFeatures }) => {
      return [
        ...defaultFeatures,
        MarkFeature(),
        // SuperscriptTextFeature(),
        HTMLConverterFeature(({converters({ defaultConverters }) {
          return [...defaultConverters, markHTMLConverter]
        },})),
        // SubscriptTextFeature(),
        // SuperscriptTextFeature(),
        // InlineCodeTextFeature(),
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
