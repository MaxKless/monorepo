declare module "virtual:inlang-static" {
	export const sourceLanguageTag: import("@inlang/app").LanguageTag
	export const languageTags: import("@inlang/app").LanguageTag[]
	export const messages: import("@inlang/app").Message[]
}