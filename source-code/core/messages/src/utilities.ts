import type { LanguageTag } from "@inlang/language-tag"
import type { Message, Variant } from "./api.js"
import type { Result } from "@inlang/result"

/**
 * Get the variant of a message
 *
 * All actions are immutable.
 *
 * @example
 * 	const variant = getVariant(message, { languageTag: "en", selectors: { gender: "male" }});
 */
export function getVariant(
	message: Message,
	options: {
		languageTag: LanguageTag
		selectors: Record<string, string>
	},
): Result<
	Variant["pattern"],
	VariantDoesNotExistException | PatternsForLanguageTagDoNotExistException
> {
	if (!message.body[options.languageTag])
		return { error: new PatternsForLanguageTagDoNotExistException(message.id, options.languageTag) }
	const variant = matchMostSpecificVariant(message, options.languageTag, options.selectors)
	if (variant) {
		//! do not return a reference to the message in a resource
		//! modifications to the returned message will leak into the
		//! resource which is considered to be unmutable.
		return { data: structuredClone(variant.pattern) }
	}
	return { error: new VariantDoesNotExistException(message.id, options.languageTag) }
}

/**
 * Create a variant for a message
 *
 * All actions are immutable.
 *
 * @example
 *  const message = createVariant(message, { languageTag: "en", data: variant })
 */
export function createVariant(
	message: Message,
	options: {
		languageTag: LanguageTag
		data: Variant
	},
): Result<Message, VariantAlreadyExistsException | PatternsForLanguageTagDoNotExistException> {
	const copy: Message = structuredClone(message)
	if (getVariant(copy, { languageTag: options.languageTag, selectors: options.data.match })) {
		return { error: new VariantAlreadyExistsException(message.id, options.languageTag) }
	}
	if (copy.body[options.languageTag] === undefined) {
		return { error: new PatternsForLanguageTagDoNotExistException(message.id, options.languageTag) }
	}
	copy.body[options.languageTag]!.push(options.data)
	return { data: copy }
}

/**
 * Update a variant of a message
 *
 * All actions are immutable.
 *
 * @example
 *  const message = updateVariant(message, { languageTag: "en", selectors: { gender: "male" }, pattern: []})
 */
export function updateVariant(
	message: Message,
	options: {
		languageTag: LanguageTag
		selectors: Record<string, string>
		pattern: Variant["pattern"]
	},
): Result<Message, VariantDoesNotExistException | PatternsForLanguageTagDoNotExistException> {
	const copy: Message = structuredClone(message)
	if (copy.body[options.languageTag] === undefined) {
		return { error: new PatternsForLanguageTagDoNotExistException(message.id, options.languageTag) }
	}
	const variant = matchMostSpecificVariant(copy, options.languageTag, options.selectors)
	if (variant) {
		variant.pattern = options.pattern
		return { data: copy }
	}
	return { error: new VariantDoesNotExistException(message.id, options.languageTag) }
}

/**
 * Returns the most specific variant of a message.
 *
 * @example
 *  const variant = matchMostSpecificVariant(message, languageTag: "en", selectors: { gender: "male" })
 */
const matchMostSpecificVariant = (
	message: Message,
	languageTag: LanguageTag,
	selectors: Record<string, string>,
): Variant | undefined => {
	// resolve preferenceSelectors to match length and order of message selectors
	const resolvedSelectors: Record<string, string> = {}
	for (const messageSelector of message.selectors) {
		resolvedSelectors[messageSelector] = selectors[messageSelector] ?? "*"
	}

	const index: Record<string, any> = {}

	for (const variant of message.body[languageTag]!) {
		let isMatch = true
		//check if vaiant is a match
		for (const [key, value] of Object.entries(variant.match)) {
			if (resolvedSelectors[key] !== value && value !== "*") {
				isMatch = false
			}
		}
		if (isMatch) {
			// add variant to nested index
			function recursiveAddToIndex(
				currentIndex: Record<string, any>,
				currentKeys: string[],
				variant: Variant,
			) {
				const key = variant.match[currentKeys[0]!]
				if (currentKeys.length === 1) {
					currentIndex[key!] = variant
				} else {
					if (!currentIndex[key!]) {
						currentIndex[key!] = {}
					}
					recursiveAddToIndex(currentIndex[key!], currentKeys.slice(1), variant)
				}
			}
			recursiveAddToIndex(index, message.selectors, variant)
		}
	}

	//find the most specific variant
	const findOptimalMatch = (
		index: Record<string, any>,
		selectors: string[],
	): Variant | undefined => {
		const keys = Object.keys(index)

		for (const key of keys) {
			if (key === selectors[0] || key === "*") {
				const nextOptimal = selectors.slice(1)

				if (nextOptimal.length === 0) {
					return (index[key] as Variant) || undefined
				}

				const match = findOptimalMatch(index[key] as Record<string, any>, nextOptimal)

				if (match !== undefined) {
					return match
				}
			}
		}
		return undefined
	}

	return findOptimalMatch(index, Object.values(resolvedSelectors))
}

export class VariantDoesNotExistException extends Error {
	readonly #id = "VariantDoesNotExistException"

	constructor(messageId: string, languageTag: string) {
		super(
			`For message '${messageId}' and '${languageTag}', there doesn't exist a variant for this specific matchers.`,
		)
	}
}
export class VariantAlreadyExistsException extends Error {
	readonly #id = "VariantAlreadyExistsException"

	constructor(messageId: string, languageTag: string) {
		super(
			`For message '${messageId}' and '${languageTag}', there already exists a variant for this specific matchers.`,
		)
	}
}
export class PatternsForLanguageTagDoNotExistException extends Error {
	readonly #id = "PatternsForLanguageTagDoNotExistException"

	constructor(messageId: string, languageTag: string) {
		super(`For message '${messageId}' there are no patterns with the languageTag '${languageTag}'.`)
	}
}