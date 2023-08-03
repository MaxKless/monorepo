import type { Message, MessageQueryApi } from "@inlang/messages"
import type { LanguageTag, TranslatedStrings } from "@inlang/language-tag"
import { TranslatedStrings as TranslatedStringsSchema } from "@inlang/language-tag"
import type { InlangConfig } from "@inlang/config"
import { z } from "zod"

export type LintLevel = "error" | "warning"

export type LintRule = {
	meta: {
		id: `${string}.${string}`
		displayName: TranslatedStrings
		description: TranslatedStrings
	}
	/**
	 * The default level of the lint rule.
	 *
	 * The default level exists as a fallback if the user
	 * did not specify a level for the rule in the settings.
	 */
	defaultLevel: LintLevel
}

export type MessageLintRule<
	RuleOptions extends JSONSerializable<unknown> = Record<string, string> | unknown,
> = LintRule & {
	message: (args: {
		message: Message
		query: Pick<MessageQueryApi, "get">
		config: Readonly<InlangConfig>
		options: RuleOptions
		report: ReportMessageLint
	}) => MaybePromise<void>
}

// TODO: make it a general type for other packages to use
type JSONSerializable<
	T extends Record<string, string | string[] | Record<string, string | string[]>> | unknown,
> = T

// TODO: make it a general type for other packages to use
type MaybePromise<T> = T | Promise<T>

export type ReportMessageLint = (args: {
	messageId: Message["id"]
	languageTag: LanguageTag
	body: LintReport["body"]
}) => void

export type LintReport = {
	ruleId: LintRule["meta"]["id"]
	level: LintLevel
	body: TranslatedStrings
}

export type MessageLintReport = LintReport & {
	type: "MessageLint"
	messageId: Message["id"]
	languageTag: LanguageTag
}

export class LintException extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options)
		this.name = "LintException"
	}
}

/// ------ ZOD

export const LintRule = z.object({
	meta: z.object({
		id: z.string(),
		displayName: TranslatedStringsSchema,
		description: TranslatedStringsSchema,
	}),
	defaultLevel: z.union([z.literal("error"), z.literal("warning")]),
	setup: z.function(z.tuple([]), z.undefined()).optional(),
})