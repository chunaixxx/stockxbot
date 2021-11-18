import { Keyboard } from 'vk-io'

export const baseMarkupNotFaq = [
	[
		Keyboard.textButton({
			label: 'Купить',
			color: 'positive',
			payload: {
				choice: 'buy',
			},
		}),
		Keyboard.textButton({
			label: 'Продать',
			color: 'negative',
			payload: {
				choice: 'sell',
			},
		}),
	],
	[
		Keyboard.textButton({
			label: 'Мои объявления',
			color: 'default',
			payload: {
				choice: 'myads',
			},
		}),
	],
]

export const baseMarkup = [
	...baseMarkupNotFaq,
	[
		Keyboard.textButton({
			label: 'FAQ',
			color: 'default',
			payload: {
				choice: 'faq',
			},
		}),
	]
]
