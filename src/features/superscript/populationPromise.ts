import type { LinkFeatureProps } from '@payloadcms/richtext-lexical'
import { PopulationPromise } from '@payloadcms/richtext-lexical'
import { CustomSuperscriptSerializedLinkNode } from './nodes/CustomSuperscriptLinkNode'
import { populate } from '@payloadcms/richtext-lexical/dist/populate/populate'
import { recurseNestedFields } from '@payloadcms/richtext-lexical/dist/populate/recurseNestedFields'

export const customSuperscriptLinkPopulationPromiseHOC = (
  props: LinkFeatureProps,
): PopulationPromise<CustomSuperscriptSerializedLinkNode> => {
  const linkPopulationPromise: PopulationPromise<CustomSuperscriptSerializedLinkNode> = ({
    context,
    currentDepth,
    depth,
    editorPopulationPromises,
    field,
    findMany,
    flattenLocales,
    node,
    overrideAccess,
    populationPromises,
    req,
    showHiddenFields,
    siblingDoc,
  }) => {
    const promises: Promise<void>[] = []

    if (node?.fields?.doc?.value && node?.fields?.doc?.relationTo) {
      const collection = req.payload.collections[node?.fields?.doc?.relationTo]

      if (collection) {
        promises.push(
          populate({
            id:
              typeof node?.fields?.doc?.value === 'object'
                ? node?.fields?.doc?.value?.id
                : node?.fields?.doc?.value,
            collection,
            currentDepth,
            data: node?.fields?.doc,
            depth,
            field,
            key: 'value',
            overrideAccess,
            req,
            showHiddenFields,
          }),
        )
      }
    }
    if (Array.isArray(props.fields)) {
      recurseNestedFields({
        context,
        currentDepth,
        data: node.fields || {},
        depth,
        editorPopulationPromises,
        fields: props.fields,
        findMany,
        flattenLocales,
        overrideAccess,
        populationPromises,
        promises,
        req,
        showHiddenFields,
        siblingDoc: node.fields || {},
      })
    }
    return promises
  }

  return linkPopulationPromise
}