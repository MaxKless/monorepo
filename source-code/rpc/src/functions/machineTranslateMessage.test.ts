import { it, expect } from "vitest"
import { privateEnv } from "@inlang/env-variables"
import { machineTranslateMessage } from "./machineTranslateMessage.js"

it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
	"should translate multiple target language tags",
	async () => {
		const result = await machineTranslateMessage({
			sourceLanguageTag: "en",
			targetLanguageTags: ["de", "fr"],
			message: {
				id: "mockMessage",
				selectors: [],
				body: {
					en: [{ pattern: [{ type: "Text", value: "Hello world" }], match: {} }],
				},
			},
		})
		expect(result.error).toBeUndefined()
		expect(result.data).toEqual({
			id: "mockMessage",
			selectors: [],
			body: {
				en: [{ pattern: [{ type: "Text", value: "Hello world" }], match: {} }],
				de: [{ pattern: [{ type: "Text", value: "Hallo welt" }], match: {} }],
				fr: [{ pattern: [{ type: "Text", value: "Bonjour le monde" }], match: {} }],
			},
		})
	},
)

it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
	"should escape pattern elements that are not Text",
	async () => {
		const result = await machineTranslateMessage({
			sourceLanguageTag: "en",
			targetLanguageTags: ["de", "fr"],
			message: {
				id: "mockMessage",
				selectors: [],
				body: {
					en: [
						{
							pattern: [
								{ type: "Text", value: "Hello " },
								{ type: "VariableReference", name: "username" },
								{ type: "Text", value: "!" },
							],
							match: {},
						},
					],
				},
			},
		})
		expect(result.error).toBeUndefined()
		expect(result.data).toEqual({
			id: "mockMessage",
			selectors: [],
			body: {
				en: [
					{
						pattern: [
							{ type: "Text", value: "Good evening " },
							{ type: "VariableReference", name: "username" },
							{ type: "Text", value: ", what a beautiful sunset." },
						],
						match: {},
					},
				],
				de: [
					[
						{
							pattern: [
								{ type: "Text", value: "Guten Abend " },
								{ type: "VariableReference", name: "username" },
								{ type: "Text", value: ", welch ein schöner Sonnenuntergang." },
							],
							match: {},
						},
					],
				],
			},
		})
	},
)

it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
	"should not naively compare the variant lenghts and instead match variants",
	async () => {
		const result = await machineTranslateMessage({
			sourceLanguageTag: "en",
			targetLanguageTags: ["de", "fr"],
			message: {
				id: "mockMessage",
				selectors: [],
				body: {
					en: [
						{
							pattern: [{ type: "Text", value: "Gender male" }],
							match: {
								gender: "male",
							},
						},
					],
					de: [
						{
							pattern: [{ type: "Text", value: "Veraltete Übersetzung" }],
							match: {},
						},
					],
				},
			},
		})
		expect(result.error).toBeUndefined()
		expect(result.data).toEqual({
			id: "mockMessage",
			selectors: [],
			body: {
				en: [
					{
						pattern: [{ type: "Text", value: "Gender male" }],
						match: {
							gender: "male",
						},
					},
					{
						pattern: [{ type: "Text", value: "Gender female" }],
						match: {
							gender: "female",
						},
					},
				],
				de: [
					{
						pattern: [{ type: "Text", value: "Veraltete Übersetzung" }],
						match: {},
					},
					{
						pattern: [{ type: "Text", value: "Geschlecht männlich" }],
						match: {
							gender: "male",
						},
					},
					{
						pattern: [{ type: "Text", value: "Geschlecht weiblich" }],
						match: {
							gender: "female",
						},
					},
				],
			},
		})
	},
)