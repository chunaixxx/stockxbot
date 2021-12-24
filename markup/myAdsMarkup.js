import { Keyboard } from 'vk-io'

export const myAdsMarkupNotSize = [
	[
		Keyboard.textButton({
			label: 'Цена',
			color: 'positive',
		}),
        Keyboard.textButton({
			label: 'Доставка',
			color: 'positive',
		}),
	],
	[
        Keyboard.textButton({
			label: 'Удалить',
			color: 'negative',
		}),
		Keyboard.textButton({
			label: 'Назад',
			color: 'default',
		}),
	],
]


export const myAdsMarkup = [
	[
		Keyboard.textButton({
			label: 'Цена',
			color: 'positive',
		}),
        Keyboard.textButton({
			label: 'Размер',
			color: 'positive',
		}),
	],
    [
        Keyboard.textButton({
			label: 'Доставка',
			color: 'positive',
		}),
        Keyboard.textButton({
			label: 'Примерка',
			color: 'positive',
		}),
    ],
	[
        Keyboard.textButton({
			label: 'Удалить',
			color: 'negative',
		}),
		Keyboard.textButton({
			label: 'Назад',
			color: 'default',
		}),
	],
]


