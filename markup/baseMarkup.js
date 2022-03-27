import { Keyboard } from 'vk-io'

export const baseMarkupNotFaq = [
	[
		Keyboard.textButton({
			label: 'Купить',
			color: 'positive',
		}),
		Keyboard.textButton({
			label: 'Продать',
			color: 'negative',
		}),
	],
	[
		Keyboard.textButton({
			label: 'Профиль',
			color: 'default',
		}),
	],
]

export const baseMarkup = [
	...baseMarkupNotFaq,
	[
		Keyboard.textButton({
			label: 'FAQ',
			color: 'default',
		}),
	]
]
