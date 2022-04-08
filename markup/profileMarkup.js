import { Keyboard } from 'vk-io'

export const editGoodMarkup = [
    [
        Keyboard.textButton({
			label: 'Описание',
			color: 'primary',
		})
    ],
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

export const editGoodNotSizeMarkup = [
    [
        Keyboard.textButton({
			label: 'Описание',
			color: 'primary',
		})
    ],
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

export const deleteDescGoodMarkup = [
    [
        Keyboard.textButton({
            label: 'Удалить',
            color: 'negative',
        }),
    ]
]

export const updateGoodsMarkup = [
    [
		Keyboard.textButton({
			label: 'Обновить товары',
			color: 'positive',
		}),
	],
]

export const editGoodsMarkup = [
	[
		Keyboard.textButton({
			label: 'Все объявления',
			color: 'primary',
		}),
	],    
]

export const showOtherProfileMarkup = [
	[
		Keyboard.textButton({
			label: 'Чужой профиль',
			color: 'primary',
		}),
	],    
]

export const subArchiveMarkup = [
	[
		Keyboard.textButton({
			label: 'Напоминать об актуальности',
			color: 'positive',
		}),
	],    
]

export const unSubArchiveMarkup = [
	[
		Keyboard.textButton({
			label: 'Не напоминать об актуальности',
			color: 'negative',
		}),
	],    
]


export const subSearchGoodMarkup = [
	[
		Keyboard.textButton({
			label: 'Подписка на поиск',
			color: 'primary',
		}),
	],        
]

export const editAllGoodsMarkup = [
    [
        Keyboard.textButton({
			label: 'Доставка',
			color: 'primary',
		}),
        Keyboard.textButton({
			label: 'Примерка',
			color: 'primary',
		}),
    ],
    [
        Keyboard.textButton({
			label: 'Цена',
			color: 'primary',
		}),
    ]
]
