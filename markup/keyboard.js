import { Keyboard } from 'vk-io'

export default (...args) => {
    return Keyboard.keyboard(...args).inline()
}