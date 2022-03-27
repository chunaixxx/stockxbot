import { Keyboard } from 'vk-io'

export const menuMarkup = [
    Keyboard.textButton({
        label: 'Меню',
        color: 'default',
    }),
]

export const previousMarkup = [
	Keyboard.textButton({
		label: 'Назад',
		color: 'default',
	}),
]

export const skipMarkup = [
	Keyboard.textButton({
		label: 'Пропустить',
		color: 'default',
	}),
]

export const cancelMarkup = [
    Keyboard.textButton({
        label: 'Отмена',
        color: 'negative',
    }),
]

export const answerMarkup = [
    Keyboard.textButton({
        label: 'Да',
        color: 'positive',
    }),
    Keyboard.textButton({
        label: 'Нет',
        color: 'negative',
    })
]

export const nextMarkup = [
	[
		Keyboard.textButton({
			label: 'Продолжить',
			color: 'default',
		}),
	],
]

export const nextPageMarkup = [
	Keyboard.textButton({
		label: 'Следующая страница',
		color: 'default',
	}),
]

export const exitPageMarkup = [
	Keyboard.textButton({
		label: 'Закончить просмотр',
		color: 'default',
	}),
]
