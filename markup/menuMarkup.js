import { Keyboard } from 'vk-io'

const menuMarkup = [
        Keyboard.textButton({
            label: 'Меню',
            color: 'default',
            payload: {
                choice: 'menu'
            }
        }),
]

export default menuMarkup