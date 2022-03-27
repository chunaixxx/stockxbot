import config from 'config'
import Good from '../models/Good'
import CachedGood from '../models/CachedGood'
import sortGoodsByPrice from './sortGoodsByPrice'
import generateImage from './generateImage'
import generateCarouselImage from './generateCarouselImage'

import vk from '../commonVK'

export default async goods => {
    try {
        const carousel = []
        const carouselPhotos = {}
        const group = config.get('groupID')

        for (const good of goods) {
            if (carouselPhotos.hasOwnProperty(good.goodName) == false) {
                const cachedGood = await CachedGood.findOne({ url: good.url })
        
                const cachedCarouselPhoto = cachedGood?.carouselsPhoto[group]

                // Если картинка этого товара не загружена в альбом группы
                if (cachedCarouselPhoto == undefined) {
                    const goodName = good.filename
                    const imgPath = `./images/carousel/${ good.filename }.jpg`

                    await generateCarouselImage(good.imgUrl, good.filename)

                    const attachment = await vk.upload.messagePhoto({
                        peer_id: 0,
                        source: { value: imgPath }
                    })

                    await CachedGood.updateOne(
                        { url: good.url }, 
                        { carouselsPhoto: attachment.toString()}
                    )

                    const photoString = attachment.toString().replace('photo', '')

                    carouselPhotos[`${good.goodName}`] = photoString
                } else {
                    carouselPhotos[good.goodName] = cachedCarouselPhoto
                }
            }
        }

        for (const good of goods) {
            let description = ''

            let formattedCity = good.city.length > 16 ? '' : good.city + ' |'

            if (good.size)
                description += `${ formattedCity } ${good.size} US | ${good.price}руб.\nДоставка: ${good.hasDelivery} | Примерка: ${good.hasFitting}`
		    else
                description += `${ formattedCity } ${good.price}руб. | Доставка: ${good.hasDelivery}`

            let formattedSellerName = ''

            if (good.sellerName.length >= 23)
                formattedSellerName = good.sellerName.substring(0, 20) + '...'
            else
                formattedSellerName = good.sellerName

            const carouselItem = {
                title: good.goodName,
                description,
                photo_id: carouselPhotos[`${good.goodName}`],
                buttons: [
                    {         
                        action: {
                            type: 'open_link',
                            link: `https://vk.com/id${good.sellerId}`,
                            label: formattedSellerName,
                        }
                    }
                ]
            }

            carousel.push(carouselItem)
        }

        return {
            template: JSON.stringify({
                type: 'carousel',
                elements: carousel
            })
        }
    } catch (e) {
        console.log(e)
        return []
    }
}