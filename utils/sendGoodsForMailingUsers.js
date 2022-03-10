import MailingUser from '../models/MailingUser'
import config from 'config'
import vk from '../commonVK'
import ws from '../ws'

const sendGoodsForMailingUsers = async good => {
    try {
        const mailingUsers = await MailingUser.find({
            type: 'subscribeSearch',
            'data.userQuery.value': good.link,
    
            $and: [
                {
                    $or: [
                        { 'data.sizeRange': { $in: [good.size] } },
                        { 'data.sizeRange': { $size: 0 } },
                    ]
                },

                {
                    'data.priceRange.min': {
                        $lte: +good.price
                    }
                },  
    
                {
                    'data.priceRange.max': {
                        $gte: +good.price
                    }
                }
            ]
    
        })

        mailingUsers.forEach(async mailingUser => {
            try {
                if (mailingUser.groupId == config.get('groupID')) {
                    let sendString = `✉️ На площадке появился товар который ты ищешь!\n\n`
    
                    const { sellerName, sellerId, city, goodName, size, price, hasDelivery, hasFitting } = good
    
                    if (good.size)
                        sendString += `📌 @id${sellerId} (${sellerName}), ${city}\n${goodName}\nРазмер: ${size} | Цена: ${price}руб. | Доставка: ${hasDelivery} | Примерка: ${hasFitting}\n\n`
                    else
                        sendString += `📌 @id${sellerId} (${sellerName}), ${city}\n${goodName}\nЦена: ${price}руб. | Доставка: ${hasDelivery}\n\n`

                    await vk.api.messages.send({
                        user_id: +mailingUser.userId,
                        random_id: Date.now(),
                        message: sendString
                    })
                } else {
                    ws.sendMessage({
                        from: config.get('groupID'),
                        to: mailingUser.groupId,
                        type: 'subscribeSearch',
                        user: mailingUser,
                        good
                    })
                }
            } catch (e) {
                console.log(e)
            }
        })
    } catch (e) {
        console.log(e)
    }
}

export default sendGoodsForMailingUsers
