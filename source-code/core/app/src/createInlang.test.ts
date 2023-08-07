import { describe, it, expect } from "vitest"
import { createInlang } from "./createInlang.js"
// eslint-disable-next-line no-restricted-imports
import fs from "node:fs/promises"
import type { InlangConfig } from "@inlang/config"
import type { Message, Plugin } from "@inlang/plugin"
import type { LintRule } from "@inlang/lint"
import type { InlangModule } from "@inlang/module"
// @ts-ignore
import { createSignal, createRoot, createEffect } from "solid-js/dist/solid.js"

const config: InlangConfig = {
	sourceLanguageTag: "en",
	languageTags: ["en"],
	modules: ["./dist/index.js"],
	settings: {
		plugins: {
			"inlang.plugin-i18next": {
				options: {
					pathPattern: "./examples/example01/{languageTag}.json",
					variableReferencePattern: ["{", "}"],
				},
			},
		},
		lintRules: {
			"inlang.missingMessage": {
				level: "error",
			},
		},
	},
}

const mockPlugin: Plugin = {
	meta: {
		id: "inlang.plugin-i18next",
		description: { en: "Mock plugin description" },
		displayName: { en: "Mock Plugin" },
		keywords: [],
	},
	loadMessages: () => exampleMessages,
	saveMessages: () => undefined as any,
	addAppSpecificApi: () => ({
		"inlang.ide-extension": {
			messageReferenceMatcher: () => undefined as any,
		},
	}),
}

const exampleMessages: Message[] = [
	{
		id: "common:a..b",
		selectors: [],
		body: {
			en: [
				{
					match: {},
					pattern: [
						{
							type: "Text",
							value: "test",
						},
					],
				},
			],
		},
	},
	{
		id: "common:c.",
		selectors: [],
		body: {
			en: [
				{
					match: {},
					pattern: [
						{
							type: "Text",
							value: "test",
						},
					],
				},
			],
		},
	},
]

const mockLintRule: LintRule = {
	meta: {
		id: "inlang.missingMessage",
		description: { en: "Mock lint rule description" },
		displayName: { en: "Mock Lint Rule" },
	},
	defaultLevel: "error",
}

const $import = async () =>
	({
		default: {
			plugins: [mockPlugin],
			lintRules: [mockLintRule],
		},
	} satisfies InlangModule)

describe("config", () => {
	it("should get the config", async () => {
		await fs.writeFile("./inlang.config.json", JSON.stringify(config))
		const inlang = await createInlang({
			configPath: "./inlang.config.json",
			nodeishFs: fs,
			_import: $import,
		})
		expect(inlang.config.get()).toEqual(config)
	})

	// TO DO: test that config set
	it("should set the new config", async () => {
		await fs.writeFile("./inlang.config.json", JSON.stringify(config))
		const inlang = await createInlang({
			configPath: "./inlang.config.json",
			nodeishFs: fs,
			_import: $import,
		})
		const newConfig = { ...config, languageTags: ["en", "de"] }
		inlang.config.set(newConfig)
		expect(inlang.config.get()).toEqual(newConfig)
	})

	it("should be reactive if the config changes", async () => {
		createRoot(async () => {
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			})
			const reactiveConfig = inlang.config.get
			let counter = 0

			createEffect(() => {
				// 2 times because init + set
				if (!reactiveConfig().languageTags) return
				counter += 1
			})

			inlang.config.set({ ...reactiveConfig(), languageTags: ["en", "de"] })
			expect(counter).toBe(2)
		})
	})
})

describe("query", () => {
	it("get", async () => {
		await fs.writeFile("./inlang.config.json", JSON.stringify(config))
		const inlang = await createInlang({
			configPath: "./inlang.config.json",
			nodeishFs: fs,
			_import: $import,
		})
		const message = inlang.messages.query.get({ where: { id: "common:a..b" } })
		expect(message?.id).toBe("common:a..b")
	})
})