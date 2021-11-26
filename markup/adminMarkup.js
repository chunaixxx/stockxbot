import { Keyboard } from 'vk-io'

export const adminMarkup = [
	Keyboard.textButton({
		label: 'Управление',
		color: 'negative',
	}),
]

export const adminMenuMarkup = [
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
	],
	[
		Keyboard.textButton({
			label: 'Назначить администратора',
			color: 'default',
		}),
		Keyboard.textButton({
			label: 'Снять администратора',
			color: 'default',
		}),
	],
	[
		Keyboard.textButton({
			label: 'Статистика',
			color: 'positive',
		}),
	],
]

export const settingsMarkup = [
	Keyboard.textButton({
		label: 'Cупер-админ',
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
