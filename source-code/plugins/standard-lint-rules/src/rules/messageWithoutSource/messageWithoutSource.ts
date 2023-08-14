import type { MessageLintRule } from "@inlang/lint"

export const messageWithoutSourceRule: MessageLintRule = {
	type: "MessageLint",
	meta: {
		id: "inlang.lintRule.messageWithoutSource",
		displayName: {
			en: "Message Without Source",
		},
		description: {
			en: `
Checks for likely outdated messages.

A message with a missing source is usually an indication that
the message (id) is no longer used in source code, but messages
have not been updated accordingly.
`,
		},
	},
	defaultLevel: "error",
	message: ({ message: { id, body }, sourceLanguageTag, report }) => {
		if (Object.keys(body).length && !body[sourceLanguageTag]) {
			report({
				messageId: id,
				languageTag: sourceLanguageTag,
				body: {
					en: `Message with id '${id}' is specified, but missing in the source.`,
				},
			})
		}
	},
}