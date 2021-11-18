import { Keyboard } from 'vk-io'

const answerMarkup = [
        Keyboard.textButton({
            label: 'Да',
            color: 'positive',
            payload: {
                choice: 'yes'
            }
        }),
        Keyboard.textButton({
            label: 'Нет',
            color: 'negative',
            payload: {
                choice: 'no'
            }
        })
]

export default answerMarkup