/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createVariant, getVariant, updateVariantPattern } from "./variant.js"
import { describe, test, expect } from "vitest"
import {
	MessagePatternsForLanguageTagDoNotExistError,
	MessageVariantAlreadyExistsError,
	MessageVariantDoesNotExistError,
} from "./errors.js"
import type { Message, Variant } from "../versionedInterfaces.js"

describe("getVariant", () => {
	test("should return the correct variant of a message", () => {
		const mockMessage: Message = getMockMessage()

		const variant = getVariant(mockMessage, {
			where: {
				languageTag: "en",
				selectors: { gender: "female", guestOther: "1" },
			},
		})

		expect(variant?.pattern[0]).toStrictEqual({
			type: "Text",
			value: "{$hostName} invites {$guestName} to her party.",
		})
	})

	test("should return the correct fallback because the exact match does not exist", () => {
		const mockMessage: Message = getMockMessage()

		const variant = getVariant(mockMessage, {
			where: {
				languageTag: "en",
				selectors: { gender: "female", guestOther: "0" },
			},
		})
		expect(variant?.pattern[0]).toStrictEqual({
			type: "Text",
			value: "{$hostName} invites {$guestName} and {$guestsOther} other people to her party.",
		})
	})

	test("it should return undefined (but never throw an error) if selectors is an empty array", () => {
		const mockMessage: Message = {
			id: "mockMessage",
			selectors: [],
			variants: [
				{
					languageTag: "en",
					pattern: [{ type: "Text", value: "Gender male" }],
					match: {
						gender: "male",
					},
				},
				{
					languageTag: "de",
					pattern: [{ type: "Text", value: "Veraltete Übersetzung" }],
					match: {},
				},
			],
		}
		const variant = getVariant(mockMessage, {
			where: {
				languageTag: "fr",
				selectors: {},
			},
		})
		expect(variant).toBeUndefined()
	})

	test("the matcher should resolve not existing selectors to '*'", () => {
		const mockMessage: Message = getMockMessage()

		const variant = getVariant(mockMessage, {
			where: {
				languageTag: "en",
				selectors: { guestOther: "0" },
			},
		})
		expect(variant?.pattern[0]).toStrictEqual({
			type: "Text",
			value: "{$hostName} does not give a party.",
		})
	})

	test("empty selector should result in '*','*'", () => {
		const mockMessage: Message = getMockMessage()

		const variant = getVariant(mockMessage, {
			where: {
				languageTag: "en",
				selectors: {},
			},
		})
		expect(variant?.pattern[0]).toStrictEqual({
			type: "Text",
			value: "{$hostName} invites {$guestName} and {$guestsOther} other people to their party.",
		})
	})

	test("non existing selector values should be resolved", () => {
		const mockMessage: Message = getMockMessage()

		const variant = getVariant(mockMessage, {
			where: {
				languageTag: "en",
				selectors: { gender: "trans", guestOther: "2" },
			},
		})
		expect(variant?.pattern[0]).toStrictEqual({
			type: "Text",
			value: "{$hostName} invites {$guestName} and one other person to their party.",
		})

		const variant2 = getVariant(mockMessage, {
			where: {
				languageTag: "en",
				selectors: { gender: "male", guestOther: "8" },
			},
		})
		expect(variant2?.pattern[0]).toStrictEqual({
			type: "Text",
			value: "{$hostName} invites {$guestName} and {$guestsOther} other people to his party.",
		})
	})

	test("should return undefined of no variant matches", () => {
		const mockMessage: Message = getMockMessage()
		mockMessage.variants = [
			...mockMessage.variants!.filter(
				(v) => v.languageTag === "en" && (v.match.gender !== "*" || v.match.guestOther !== "*"),
			),
		]

		const variant = getVariant(mockMessage, {
			where: {
				languageTag: "en",
				selectors: {},
			},
		})
		expect(variant).toBeUndefined()
	})

	test("should return undefined if a variant for specific language does not exist", () => {
		const mockMessage: Message = getMockMessage()

		const variant = getVariant(mockMessage, {
			where: {
				languageTag: "de",
				selectors: { gender: "female", guestOther: "1" },
			},
		})
		expect(variant).toBeUndefined()
	})

	test("should return the catch all variant if no selector defined", () => {
		const mockMessage: Message = {} as any
		mockMessage.variants = [
			{
				languageTag: "en",
				match: {},
				pattern: [
					{
						type: "Text",
						value: "test",
					},
				],
			},
		]

		const variant = getVariant(mockMessage, {
			where: {
				languageTag: "en",
				selectors: {},
			},
		})
		// should return the female variant
		expect(variant?.pattern[0]).toStrictEqual({
			type: "Text",
			value: "test",
		})
	})
})

describe("createVariant", () => {
	test("should create a variant for a message", () => {
		const mockMessage: Message = getMockMessage()

		const newVariant: Variant = {
			languageTag: "en",
			match: { gender: "female", guestOther: "0" },
			pattern: [],
		}
		const message = createVariant(mockMessage, {
			data: newVariant,
		})
		// should return the female variant
		expect(
			message.data!.variants.find(
				(v) => v.languageTag === "en" && v.match.gender === "female" && v.match.guestOther === "0",
			)?.pattern,
		).toStrictEqual([])
	})

	test("should create a variant, also if matcher are not full defined", () => {
		const mockMessage: Message = getMockMessage()
		mockMessage.variants = [
			...mockMessage.variants!.filter(
				(v) => v.languageTag === "en" && (v.match.gender !== "*" || v.match.guestOther !== "*"),
			),
		]

		const message = createVariant(mockMessage, {
			data: {
				languageTag: "en",
				match: {},
				pattern: [],
			},
		})
		// should return the female variant
		expect(
			message.data!.variants.find(
				(v) => v.languageTag === "en" && v.match.gender === "*" && v.match.guestOther === "*",
			)?.pattern,
		).toStrictEqual([])
	})

	test("should return error if variant matches", () => {
		const mockMessage: Message = getMockMessage()

		const variant = createVariant(mockMessage, {
			data: {
				languageTag: "en",
				match: { gender: "male", guestOther: "1" },
				pattern: [],
			},
		})
		// should return the female variant
		expect(variant.data).toBeUndefined()
		expect(variant.error).toBeInstanceOf(MessageVariantAlreadyExistsError)
	})

	test("should not return error if set of variants for specific language does not exist", () => {
		const mockMessage: Message = getMockMessage()

		const variant = createVariant(mockMessage, {
			data: {
				languageTag: "de",
				match: { gender: "female", guestOther: "1" },
				pattern: [],
			},
		})
		// should return the female variant
		expect(variant.data).toBeDefined()
		expect(variant.error).toBeUndefined()
	})
})

describe("updateVariant", () => {
	test("should update a variant of a message", () => {
		const mockMessage: Message = getMockMessage()

		const message = updateVariantPattern(mockMessage, {
			where: {
				languageTag: "en",
				selectors: { gender: "female", guestOther: "1" },
			},
			data: [],
		})
		// should return the female variant
		expect(
			message.data!.variants.find(
				(v) => v.languageTag === "en" && v.match.gender === "female" && v.match.guestOther === "1",
			)?.pattern,
		).toStrictEqual([])
	})

	test("should update a variant, also if matcher are not full defined", () => {
		const mockMessage: Message = getMockMessage()

		const message = updateVariantPattern(mockMessage, {
			where: {
				languageTag: "en",
				selectors: {},
			},
			data: [],
		})
		// should return the female variant
		expect(
			message.data!.variants.find(
				(v) => v.languageTag === "en" && v.match.gender === "*" && v.match.guestOther === "*",
			)?.pattern,
		).toStrictEqual([])
	})

	test("should return error if no variant matches", () => {
		const mockMessage: Message = getMockMessage()

		mockMessage.variants = [
			...mockMessage.variants!.filter(
				(v) => v.languageTag === "en" && (v.match.gender !== "*" || v.match.guestOther !== "*"),
			),
		]

		const variant = updateVariantPattern(mockMessage, {
			where: {
				languageTag: "en",
				selectors: {},
			},
			data: [],
		})
		// should return the female variant
		expect(variant.data).toBeUndefined()
		expect(variant.error).toBeInstanceOf(MessageVariantDoesNotExistError)
	})

	test("should return error if set of variants for specific language does not exist", () => {
		const mockMessage: Message = getMockMessage()

		const variant = updateVariantPattern(mockMessage, {
			where: {
				languageTag: "de",
				selectors: {},
			},
			data: [],
		})
		// should return the female variant
		expect(variant.data).toBeUndefined()
		expect(variant.error).toBeInstanceOf(MessagePatternsForLanguageTagDoNotExistError)
	})
})

const getMockMessage = (): Message => {
	return {
		id: "first-message",
		selectors: [
			{ type: "VariableReference", name: "gender" },
			{ type: "VariableReference", name: "guestOther" },
		],
		variants: [
			{
				languageTag: "en",
				match: { gender: "female", guestOther: "1" },
				pattern: [
					{
						type: "Text",
						value: "{$hostName} invites {$guestName} to her party.",
					},
				],
			},
			{
				languageTag: "en",
				match: { gender: "female", guestOther: "2" },
				pattern: [
					{
						type: "Text",
						value: "{$hostName} invites {$guestName} and one other person to her party.",
					},
				],
			},
			{
				languageTag: "en",
				match: { gender: "female", guestOther: "*" },
				pattern: [
					{
						type: "Text",
						value: "{$hostName} invites {$guestName} and {$guestsOther} other people to her party.",
					},
				],
			},
			{
				languageTag: "en",
				match: { gender: "male", guestOther: "1" },
				pattern: [
					{
						type: "Text",
						value: "{$hostName} invites {$guestName} to his party.",
					},
				],
			},
			{
				languageTag: "en",
				match: { gender: "male", guestOther: "2" },
				pattern: [
					{
						type: "Text",
						value: "{$hostName} invites {$guestName} and one other person to his party.",
					},
				],
			},
			{
				languageTag: "en",
				match: { gender: "male", guestOther: "*" },
				pattern: [
					{
						type: "Text",
						value: "{$hostName} invites {$guestName} and {$guestsOther} other people to his party.",
					},
				],
			},
			{
				languageTag: "en",
				match: { gender: "*", guestOther: "0" },
				pattern: [
					{
						type: "Text",
						value: "{$hostName} does not give a party.",
					},
				],
			},
			{
				languageTag: "en",
				match: { gender: "*", guestOther: "1" },
				pattern: [
					{
						type: "Text",
						value: "{$hostName} invites {$guestName} to their party.",
					},
				],
			},
			{
				languageTag: "en",
				match: { gender: "*", guestOther: "2" },
				pattern: [
					{
						type: "Text",
						value: "{$hostName} invites {$guestName} and one other person to their party.",
					},
				],
			},
			{
				languageTag: "en",
				match: { gender: "*", guestOther: "*" },
				pattern: [
					{
						type: "Text",
						value:
							"{$hostName} invites {$guestName} and {$guestsOther} other people to their party.",
					},
				],
			},
		],
	}
}
