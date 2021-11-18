import { Keyboard } from 'vk-io'

const cancelMarkup = [
        Keyboard.textButton({
            label: 'Отмена',
            color: 'negative',
            payload: {
                choice: 'cancel'
            }
        }),
]

export default cancelMarkup