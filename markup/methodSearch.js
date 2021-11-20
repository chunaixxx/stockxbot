import { Keyboard } from 'vk-io'

const answerMarkup = [
        Keyboard.textButton({
            label: 'Название',
            color: 'positive',
        }),
        Keyboard.textButton({
            label: 'Ссылка',
            color: 'positive',
        })
]

export default answerMarkup