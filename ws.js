import WebSocket from 'ws'
import config from 'config'
import vk from './commonVK'

class WS {
    constructor() {
        if (typeof WS.instance === 'object')
            return WS.instance

        WS.instance = this

        this.connect()
    }

    connect() {
        this.ws = new WebSocket(`ws://localhost:1337?groupId=${config.get('groupID')}`)

        console.log('CLIENT: connect')

        this.ws.on('message', data => this.onMessage(data))
        this.ws.on('close', () => this.onClose())
        this.ws.on('error', e => console.log(e))
    }

    async onMessage(data) {
        try {
            data = JSON.parse(data)

            if (data.type == 'subscribeSearch') {
                let sendString = `✉️ На площадке появился товар который ты ищешь!\n\n`
        
                const { sellerName, sellerId, city, goodName, size, price, hasDelivery, hasFitting } = data.good
    
                if (size)
                    sendString += `📌 @id${sellerId} (${sellerName}), ${city}\n${goodName}\nРазмер: ${size} | Цена: ${price}руб. | Доставка: ${hasDelivery} | Примерка: ${hasFitting}\n\n`
                else
                    sendString += `📌 @id${sellerId} (${sellerName}), ${city}\n${goodName}\nЦена: ${price}руб. | Доставка: ${hasDelivery}\n\n`
    
                await vk.api.messages.send({
                    user_id: +data.user.userId,
                    random_id: Date.now(),
                    message: sendString
                })
            }            
        } catch (e) {
            console.log(e)
        }
    }

    sendMessage(data) {
        this.ws.send(JSON.stringify(data))
    }

    onClose() {
        console.log('CLIENT: close server')

        this.ws = null

        setTimeout(() => {
            console.log('CLIENT: reconnect')
            this.connect()
        }, 10000)
    }
}

const ws = new WS()

export default ws