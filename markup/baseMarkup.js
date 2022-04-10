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
    [
        Keyboard.urlButton({
            label: '🚀 PRO',
            url: 'https://m.vk.com/topic-209170354_48533970'
        })
    ]
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
