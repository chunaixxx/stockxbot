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
            label: 'Назначить администратора',
            color: 'default',
        }),
        Keyboard.textButton({
            label: 'Снять администратора',
            color: 'default',
        }),
    ]
]