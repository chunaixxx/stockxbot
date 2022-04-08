import { Keyboard } from 'vk-io'

export const adminMarkup = [
	Keyboard.textButton({
		label: 'Управление',
		color: 'negative',
	}),
]

export const addExtendedMarkup = [
	Keyboard.textButton({
		label: 'Выдать PRO',
		color: 'positive',
	}),
]

export const extendExtendedMarkup = [
	Keyboard.textButton({
		label: 'Продлить PRO',
		color: 'positive',
	}),
]

export const removeExtendedMarkup = [
	Keyboard.textButton({
		label: 'Забрать PRO',
		color: 'negative',
	}),
]

export const removeAllAdsMarkup = [
	Keyboard.textButton({
		label: 'Удалить объявления пользователя',
		color: 'default',
	}),
]

export const mainAdminMarkup = [
	[
		Keyboard.textButton({
			label: 'Статистика',
			color: 'positive',
		}),
	],
	[
		Keyboard.textButton({
			label: 'Выбрать меня',
			color: 'positive',
		}),
	],
]

export const banMarkup = [
	Keyboard.textButton({
		label: 'Заблокировать',
		color: 'negative',
	}),
]

export const unBanMarkup = [
	Keyboard.textButton({
		label: 'Разблокировать',
		color: 'positive',
	}),
]

export const banReasonMarkup = [
	[
		Keyboard.textButton({
			label: 'Неактуальная цена товаров',
			color: 'negative',
		}),
	],
	[
		Keyboard.textButton({
			label: 'Неактуальные товары ',
			color: 'negative',
		}),
	],
	[
		Keyboard.textButton({
			label: 'Продажа подделок',
			color: 'negative',
		}),
	],
	[
		Keyboard.textButton({
			label: 'Несоблюдение правил пользования ботом',
			color: 'negative',
		}),
	],
]

export const settingsMarkup = [
	Keyboard.textButton({
		label: 'Владелец',
		color: 'negative',
	}),
]

export const addAdminMarkup = [
	Keyboard.textButton({
		label: 'Назначить администратора',
		color: 'positive',
	}),
]

export const deleteAdminMarkup = [
	Keyboard.textButton({
		label: 'Снять администратора',
		color: 'negative',
	}),
]

export const settingsMenuMarkup = [
	[
		Keyboard.textButton({
			label: 'Поисков в месяц',
			color: 'default',
		}),
	],
	[
		Keyboard.textButton({
			label: 'Объявлений в месяц',
			color: 'default',
		}),
	],
    [
        Keyboard.textButton({
			label: 'Промокоды',
			color: 'default',
		}),
    ]
]

export const createPromocodeMarkup = [
    [
        Keyboard.textButton({
			label: 'Создать промокод',
			color: 'positive',
		}),
    ]    
]

export const selectDaysMarkup = [
    [
        Keyboard.textButton({
            label: '1',
            color: 'primary',
        }),
    
        Keyboard.textButton({
            label: '7',
            color: 'primary',
        }),
    
        Keyboard.textButton({
            label: '14',
            color: 'primary',
        }),
    ],

    [
        Keyboard.textButton({
            label: '30',
            color: 'primary',
        }),
    
        Keyboard.textButton({
            label: 'Навсегда',
            color: 'primary',
        }),
    ]
]

export const manageSearchSellMenuMarkup = [
    Keyboard.textButton({
        label: 'Управление поисками/продажами',
        color: 'default',
    }),  
]

export const manageSearchSellMarkup = [
    [
        Keyboard.textButton({
            label: 'Выдать поиски',
            color: 'positive',
        }),
    
        Keyboard.textButton({
            label: 'Забрать поиски',
            color: 'negative',
        }),
    ],

    [
        Keyboard.textButton({
            label: 'Выдать продажи',
            color: 'positive',
        }),
    
        Keyboard.textButton({
            label: 'Забрать продажи',
            color: 'negative',
        }),
    ],
]