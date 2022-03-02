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

export const mainMenuProfile = [
	[
		Keyboard.textButton({
			label: 'Все объявления',
			color: 'positive',
		}),
	],

    [
		Keyboard.textButton({
			label: 'Обновить товары',
			color: 'positive',
		}),
	],
]

export const subsribeMailing = [
	[
		Keyboard.textButton({
			label: 'Напоминать об актуальности',
			color: 'positive',
		}),
	],    
]

export const unsubsribeMailing = [
	[
		Keyboard.textButton({
			label: 'Не напоминать об актуальности',
			color: 'negative',
		}),
	],    
]

export const profileNext = [
	[
		Keyboard.textButton({
			label: 'Продолжить',
			color: 'default',
		}),
	],
]


export const allAdsSettings = [
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
]
