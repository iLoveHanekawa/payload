import { LinkNode, SerializedLinkNode, type LinkFields } from "@payloadcms/richtext-lexical";

export default class CustomSuperscript extends LinkNode {
    constructor({ key, fields }: { key: string, fields: LinkFields}) {
        super({ key, fields })
    }

    static getType() {
        return 'customSubscript'
    }

    static clone(node: CustomSuperscript): CustomSuperscript {
        return new CustomSuperscript({ key: node.__key, fields: node.__fields })
    }

    static importJSON(serializedNode: SerializedLinkNode): LinkNode {
        return super.importJSON(serializedNode);
    }

    exportJSON(): SerializedLinkNode {
        return super.exportJSON();
    }
}