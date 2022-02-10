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