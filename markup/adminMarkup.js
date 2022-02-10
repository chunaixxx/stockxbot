import { Keyboard } from 'vk-io'

export const adminMarkup = [
	Keyboard.textButton({
		label: 'Управление',
		color: 'negative',
	}),
]

export const editUserMarkup = [
	[
		Keyboard.textButton({
			label: 'Выдать расширенный доступ',
			color: 'default',
		}),
	],
	[
		Keyboard.textButton({
			label: 'Забрать расширенный доступ',
			color: 'default',
		}),
	],
	[
		Keyboard.textButton({
			label: 'Удалить объявления пользователя',
			color: 'default',
		}),
	]
]

export const statsMarkup = [
    Keyboard.textButton({
        label: 'Статистика',
        color: 'positive',
    }),
]

export const selectMyIDMarkup = [
    Keyboard.textButton({
        label: 'Выбрать меня',
        color: 'positive',
    }),
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


export const settingsMarkup = [
	Keyboard.textButton({
		label: 'Владелец',
		color: 'negative',
	}),
]

export const addAdmin = [
    Keyboard.textButton({
        label: 'Назначить администратора',
        color: 'positive',
    }),
]

export const deleteAdmin = [
    Keyboard.textButton({
        label: 'Снять администратора',
        color: 'negative',
    }),
]


export const settingsMenuMarkup = [
	[
		Keyboard.textButton({
			label: 'Время отката',
			color: 'default',
		}),
	],
	[
		Keyboard.textButton({
			label: 'Максимальное кол-во поисков',
			color: 'default',
		}),
	],
	[
		Keyboard.textButton({
			label: 'Максимальное кол-во товаров',
			color: 'default',
		}),
	],
]
