/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, test } from "vitest"
import { lintSingleMessage } from "@inlang/sdk/lint"
import type { Message } from "@inlang/message"
import { identicalPatternRule } from "./identicalPattern.js"

const message1: Message = {
	id: "1",
	selectors: [],
	variants: [
		{ languageTag: "en", match: {}, pattern: [{ type: "Text", value: "This is Inlang" }] },
		{ languageTag: "de", match: {}, pattern: [{ type: "Text", value: "Das ist Inlang" }] },
		{ languageTag: "fr", match: {}, pattern: [{ type: "Text", value: "This is Inlang" }] },
	],
}

const messages = [message1]

test("should report if identical message found in another language", async () => {
	const result = await lintSingleMessage({
		sourceLanguageTag: "en",
		languageTags: ["en"],
		ruleLevels: {
			[identicalPatternRule.meta.id]: "warning",
		},
		ruleSettings: {},
		messages,
		message: message1,
		rules: [identicalPatternRule],
	})

	expect(result.errors).toHaveLength(0)
	expect(result.data).toHaveLength(1)
	expect(result.data[0]!.languageTag).toBe("fr")
})

test("should not report if pattern is present in 'ignore'", async () => {
	const result = await lintSingleMessage({
		sourceLanguageTag: "en",
		languageTags: ["en"],
		ruleLevels: {
			[identicalPatternRule.meta.id]: "warning",
		},
		ruleSettings: {
			[identicalPatternRule.meta.id]: {
				ignore: ["This is Inlang"],
			},
		},
		messages,
		message: message1,
		rules: [identicalPatternRule],
	})

	expect(result.errors).toHaveLength(0)
	expect(result.data).toHaveLength(0)
})
