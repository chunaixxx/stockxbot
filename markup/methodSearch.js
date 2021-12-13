import { Keyboard } from 'vk-io'

const answerMarkup = [
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

export default answerMarkup