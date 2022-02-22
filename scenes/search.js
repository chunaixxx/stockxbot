import config from 'config'

import Good from '../models/Good'
import BotConfig from '../models/BotConfig'

import { StepScene } from '@vk-io/scenes'

import baseSendMessage from '../baseSendMessage'

import keyboard from '../markup/keyboard'

import menuMarkup from '../markup/menuMarkup'
import { methodSearchMarkup, methodSearchOnlyNameMarkup } from '../markup/methodSearch'
import skipMarkup from '../markup/skipMarkup'
import previousMarkup from '../markup/previousMarkup'

import getGoodFromStockx from '../utils/getGoodFromStockx'
import convertURL from '../utils/convertURL'
import searchGoods from '../utils/searchGoods'
import { incrementSearch, resetSearchInfo } from '../utils/updateSearchInfo'
import convertDate from '../utils/convertDate'
import formatFoundGoodsToMessages from '../utils/formatMessages/search/foundGoods.js'

const searchScene = [
	new StepScene('search', [
		async ctx => {
            ctx.scene.state.userQuery = { type: null, value: null}
			ctx.scene.state.range = [0, Infinity]
			ctx.scene.state.sizeRange = []

			try {
				const { extendedAccess } = ctx.state.user
                const { count: countSearch, lastSearch } = ctx.state.user.searchInfo
				const { maxSearch, cooldownSearch } = await BotConfig.findOne()

				if (countSearch >= maxSearch && extendedAccess == false ) {
                    // Если пришло время выдать бесплатные поиски
					if (Date.now() - lastSearch.getTime() >= cooldownSearch) {
						await resetSearchInfo(ctx.senderId)
					} else {
						const leftTime = convertDate(+cooldownSearch + +lastSearch.getTime())

						ctx.send({
							message: `❗ Вы превысили лимит поисков (${ countSearch }/${ maxSearch }). Следующие ${ maxSearch } поиска будут доступны ${ leftTime }. Оформите расширенный доступ для неограниченного количества поисков`,
							keyboard: keyboard(menuMarkup)	
						})

						return ctx.scene.leave()
					}
				}
			} catch (e) {
				console.log(e)
				ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
				return ctx.scene.leave()
			}

            const onlyNameSearch = config.get('onlyNameSearch')

            const markup = onlyNameSearch ? methodSearchOnlyNameMarkup : methodSearchMarkup

			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message: '❗ Для того чтобы найти необходимый предмет для покупки — выберите с помощью какого метода собиратесь искать товар',
					keyboard: keyboard([...markup, ...menuMarkup]),
				})

            switch (ctx.text) {
                case 'Меню':
                    baseSendMessage(ctx)
                    return ctx.scene.leave()
                case 'Поиск скидки':
                    return ctx.send({
                        message: `Очень рады что тебя заинтересовали наши скидки! Мы делаем скидку в таких магазинах как:\n\nLamoda -25%\nLeform 35-40%\nAsos до 40%\nFarfetch до 20%\nStreet Beat до 40%\nBrandshop 15%\n\nЧтобы узнать подробности и заказать пиши https://vk.com/eileonov`,
                        keyboard: keyboard([...markup, ...menuMarkup])
                    })
                case 'Название':
                    return ctx.scene.step.go(1)
                case 'Ссылка':
                    return ctx.scene.step.go(2)
            }
		},
		// Нахождение товаров по имени
		async ctx => {
			if (ctx.scene.step.firstTime || (!ctx.text && !ctx?.attachments[0]?.url))
				return ctx.send({
					message: '❗️ Введите частичное название товара. ТОЛЬКО название!',
					keyboard: keyboard(previousMarkup),
				})

			if (ctx.text == 'Назад')
				return ctx.scene.step.go(0)

			if (ctx.text?.length < 3)
				return ctx.send({
					message: '❗ Минимальная длина запроса — 3 символа. Введите другой запрос',
					keyboard: keyboard(previousMarkup),
				})

            if (ctx.text?.length >= 100)
                return ctx.send({
                    message: '❗ Максимальная длина запроса — 100 символов. Введи другой запрос.',
                    keyboard: keyboard(previousMarkup),
                })

            const onlyNameSearch = config.get('onlyNameSearch')
            const isLink = /https?:\/\//i.test(ctx.text) || /stockx.com/i.test(ctx.text) || ctx?.attachments[0]?.url

            // Скрытая возможность поиска по ссылке в поиске по названию
            if (onlyNameSearch && isLink) {
                const link = convertURL(ctx.text || ctx?.attachments[0]?.url)

                if (/stockx.com/i.test(link) == false)
                    return ctx.send({
                        message: `❗ Ссылка не ведет на сайт stockx.com, попробуй еще раз или попробуй ввести частичное название товара.\n\nПример: stockx.com/air-jordan-1-retro-high-og-patent-bred`,
                        keyboard: keyboard(previousMarkup)
                    })

                const goodFromStockx = await getGoodFromStockx(link)

                if (!goodFromStockx)
                    return ctx.send({
                        message: `❗ Ссылка которую вы указали не ведет на товар с stockx.com, попробуй еще раз или попробуй ввести частичное название товара.\n\nПример: stockx.com/air-jordan-1-retro-high-og-patent-bred`,
                        keyboard: keyboard(previousMarkup)
                    })

                ctx.send(`❗ Бот определил твой запрос как поиск по ссылке.\nТовар: ${goodFromStockx.name}`)
        
                ctx.scene.state.userQuery = {
                    type: 'link',
                    value: link
                }
            } else {
                if (isLink)
                    return ctx.send({
                        message: `❗ Ты указал ссылку в методе "Поиск по названию". Для поиска по ссылке выбери соответсвующий метод`,
                        keyboard: keyboard(previousMarkup)
                    })

                const onlyLettersRegex = /[^a-zа-яё0-9\s]/gi
                const isInvalid = onlyLettersRegex.test(ctx.text)

                if (isInvalid)
                    return ctx.send({
                        message: `❗ В поиске разрешены только буквы и цифры. Попробуй еще раз`,
                        keyboard: keyboard(previousMarkup)
                    })

                ctx.scene.state.userQuery = {
                    type: 'word',
                    value: ctx.text
                }
            }

			ctx.scene.step.go(3)
		},
		// Нахождение товаров по ссылке
		async ctx => {
			if (ctx.scene.step.firstTime || (!ctx.text && !ctx?.attachments[0]?.url))
                return ctx.send({
                    message: '❗ Укажите ссылку на товар с сайта stockx.com, чтобы показать все объявления конкретного товара\n\nПример: stockx.com/air-jordan-1-retro-high-og-patent-bred',
                    keyboard: keyboard(previousMarkup),
                })

			if (ctx.text == 'Назад')
				return ctx.scene.step.go(0)

			const link = convertURL(ctx.text || ctx?.attachments[0]?.url)

			const goodFromStockx = await getGoodFromStockx(link)

			if (!goodFromStockx)
				return ctx.send({
					message: `❗ Ссылка не ведет на товар с stockx.com, попробуйте еще раз.\n\nПример: stockx.com/air-jordan-1-retro-high-og-patent-bred`,
					keyboard: keyboard(previousMarkup)
				})
			
            ctx.scene.state.userQuery = {
                type: 'link',
                value: link
            }

			ctx.scene.step.go(3)
		},
		// Фильтрация по размеру
        async ctx => {
            if (ctx.scene.step.firstTime || !ctx.text)
                return ctx.send({
                    message: '❗️ Использовать фильтрацию по размеру? Введите нужные размеры через пробел в том формате, в котором они указаны на stockx.com. Если не уверены в правильности ввода, обратитесь к FAQ.\n\nПример ввода: 7 7.5Y 7W 11C 4K 12.5 6c XS XXL (это все разные размерные сетки)',
                    keyboard: keyboard([...previousMarkup, ...skipMarkup]),
                })

            switch (ctx.text) {
                case 'Назад':
                    return ctx.scene.step.go(0)
                case 'Пропустить':
                    return ctx.scene.step.next()
            }

            // Валидация
            if (/us/i.test(ctx.text))
                return ctx.send({
                    message: `❗ Неправильный формат ввода. размер указывается без приставки US. Примеры ввода ниже:\n\n7.5US(M) = 7.5\n7.5US(W) = 7.5W\n7Y = 7Y\nXS = XS`,
                    keyboard: keyboard([...previousMarkup, ...skipMarkup])
                })

            if (/,/.test(ctx.text))
                return ctx.send({
                    message: `❗ Если размер нецелочисленный, то он разделяется точкой, а не запятой. Примеры ввода ниже:\n\n7.5US(M) = 7.5\n7.5US(W) = 7.5W\n7Y = 7Y\nXS = XS`,
                    keyboard: keyboard([...previousMarkup, ...skipMarkup])
                })

            if (ctx.text.match(/[a-z]/gi))
                if (!/x|s|m|l|w|y|c|k/i.test(ctx.text))
                    return ctx.send({
                        message: `❗ Ошибка с вводом буквы. Примеры переводов размеров:\n\n7.5US(M) = 7.5\n7.5US(W) = 7.5W\n7Y = 7Y\nXS = XS`,
                        keyboard: keyboard([...previousMarkup, ...skipMarkup])
                    })
            //

            const range = ctx.text.toUpperCase().split(' ')
            ctx.scene.state.sizeRange = range

            return ctx.scene.step.next()
        },
	    // Фильтрация по цене
		async ctx => {
			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message:
						'❗ Использовать фильтрацию по цене? Если да, то укажите диапазон.\n\nПример: 10000-200000',
					keyboard: keyboard([...previousMarkup, ...skipMarkup]),
				})
                
            switch (ctx.text) {
                case 'Назад':
                    return ctx.scene.step.go(0)
                case 'Пропустить':
                    return ctx.scene.step.next()
            }

			const patternNumber = /^\d+$/
			const rangeArr = ctx.text.split('-')

            // Если указаны два числа через дефис и оба они являются числом (1500-2500)
			if (rangeArr.length == 2 && patternNumber.test(rangeArr[0]) && patternNumber.test(rangeArr[1])) {
				ctx.scene.state.range = [+rangeArr[0], +rangeArr[1]]
				return ctx.scene.step.next()
			} else {
				return ctx.send({
                    message: 'Укажите диапазон в правильном формате \n\n❌ 10.000руб.-200.000руб.\n✅ 10000-200000',
                    keyboard: keyboard([...previousMarkup, ...skipMarkup])
                })
			}
		},
		// Вывод пользователю найденных товаров
		async ctx => {
            switch (ctx.text) {
                case 'Назад':
                    return ctx.scene.step.go(0)
                case 'Меню':
                    baseSendMessage(ctx)
                    return ctx.scene.leave()
            }

            try {
                // Запрос и фильтры пользователя
                const { userQuery, sizeRange, range: priceRange } = ctx.scene.state

                const searchedGoods = await searchGoods({ userQuery, sizeRange, priceRange, isHide: false })

                if (searchedGoods.length) {
                        ctx.send(`❗ По твоему запросу найдены такие объявления:`)

                        // Получить и вывести постранично найденные товары
                        let pages = formatFoundGoodsToMessages(searchedGoods)
                        pages.forEach(async page => await ctx.send(page))

                        // Для каждого товара увеличить счетчик просмотра
                        searchedGoods.forEach(async ({ _id }) =>
                            await Good.findOneAndUpdate({ _id }, { $inc: { 'views': 1 } })
                        )

                        if (config.has('messages.search.after'))
                            ctx.send(config.get('messages.search.after'))

                        // Увеличить статистику пользователя по поискам
                        await incrementSearch(ctx.senderId)
                } else {
                    if (config.has('messages.search.notFound'))
                        ctx.send(config.get('messages.search.notFound'))
                    else
                        ctx.send(`❗ Мы ничего не нашли на нашей площадке. Попробуй воспользоваться другим методом поиска или поставь другие фильтры.`)
                }

                // Обновить общую статистику бота
                await BotConfig.updateOne({ $inc: { 'stats.countSearch': 1 } })

                return ctx.scene.step.go(0)
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                return ctx.scene.leave()
            }
		},
	])	
]

export default searchScene