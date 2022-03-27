import { Keyboard } from 'vk-io'

export const methodSearchMarkup = [
        Keyboard.textButton({
            label: 'Название',
            color: 'positive',
        }),
        Keyboard.textButton({
            label: 'Ссылка',
            color: 'positive',
        }),
        [
            Keyboard.textButton({
                label: 'Поиск скидки',
                color: 'positive',
            }),
        ],
]

export const methodSearchOnlyNameMarkup = [
    Keyboard.textButton({
        label: 'Название',
        color: 'positive',
    }),
    [
        Keyboard.textButton({
            label: 'Поиск скидки',
            color: 'positive',
        }),
    ],
]

export const subscribeSearch = [
    [
        Keyboard.textButton({
            label: 'Подписаться',
            color: 'positive',
        }),
    ],
    [
        Keyboard.textButton({
            label: 'Пропустить',
            color: 'default',
        }),
    ]   
]