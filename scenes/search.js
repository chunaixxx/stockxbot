import { StepScene } from '@vk-io/scenes'

import config from 'config'

import Good from '../models/Good'
import User from '../models/User'
import BotConfig from '../models/BotConfig'
import MailingUser from '../models/MailingUser'

import baseSendMessage from '../baseSendMessage'

import keyboard from '../markup/keyboard'

import { methodSearchMarkup, methodSearchOnlyNameMarkup, subscribeSearch } from '../markup/searchMarkup'
import { skipMarkup, previousMarkup, menuMarkup, nextPageMarkup, exitPageMarkup } from '../markup/generalMarkup'

import getGoodFromStockx from '../utils/getGoodFromStockx'
import convertURL from '../utils/convertURL'
import searchGoods from '../utils/searchGoods'
import getCarousel from '../utils/getCarousel'
import { incrementSearch } from '../utils/updateSearchInfo'

const searchScene = [
	new StepScene('search', [
		async ctx => {
            ctx.scene.state.userQuery = { type: null, value: null}
			ctx.scene.state.range = [0, Infinity]
			ctx.scene.state.sizeRange = []
            ctx.scene.state.activePage = 0

            if (ctx.text == 'Меню') {
                baseSendMessage(ctx)
                return ctx.scene.leave()
            }

            const user = ctx.state.user
            if (user.freeSearch <= 0 && user.extendedAccess == null)
                return ctx.send({
                    message: `❗ У тебя закончились бесплатные поиски.\n\n🚀 Но ты всегда можешь приобрести PRO-версию и использовать бесконечное количество поисков и продаж. Обращаться к @impossiblelevell (главному администратору)`,
                    keyboard: keyboard(menuMarkup)
                })

            const onlyNameSearch = config.get('onlyNameSearch')

            const markup = onlyNameSearch ? methodSearchOnlyNameMarkup : methodSearchMarkup

			if (ctx.scene.step.firstTime || !ctx.text)
				return ctx.send({
					message: '❗ Для того чтобы найти необходимый предмет для покупки — выберите с помощью какого метода собиратесь искать товар',
					keyboard: keyboard([...markup, ...menuMarkup]),
				})

            switch (ctx.text) {
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
                value: link,
                goodName: goodFromStockx.name
            }

			ctx.scene.step.go(3)
		},
		// Фильтрация по размеру
        async ctx => {
            if (ctx.scene.step.firstTime || !ctx.text)
                return ctx.send({
                    message: config.get('messages.search.filterSize'),
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
					message: '❗ Использовать фильтрацию по цене? Если да, то укажите диапазон.\n\nПример: 10000-200000',
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
            try {
                if (ctx.scene.step.firstTime || !ctx.text) {
                    // Запрос и фильтры пользователя
                    const { userQuery, sizeRange, range: priceRange } = ctx.scene.state

                    const searchedGoods = await searchGoods({ userQuery, sizeRange, priceRange, isHide: false })
                    const user = ctx.state.user

                    if (searchedGoods.length) {
                            if (user.extendedAccess == null)
                                await User.updateOne(
                                    { userId: ctx.senderId },
                                    { $inc: { freeSearch: -1 } }
                                )

                            // Разбиваем массив товаров на подмассивы состоящие из 5 товаров
                            let searchedGoodInPages = []
                            let size = 3

                            if (user.extendedAccess)
                                size = 5

                            for (let i = 0; i < Math.ceil(searchedGoods.length / size); i++){
                                searchedGoodInPages[i] = searchedGoods.slice((i * size), (i * size) + size);
                            }
                            //

                            ctx.scene.state.searchedGoodInPages = searchedGoodInPages

                            const activePage = ctx.scene.state.activePage

                            const carousel = await getCarousel(searchedGoodInPages[activePage])


                            if (config.has('messages.search.after'))
                                ctx.send(config.get('messages.search.after'))

                            ctx.send(`❗ По твоему запросу найдены такие объявления:`)

                            // 1 страница
                            await ctx.send({
                                message: `📄 Страница ${ activePage + 1}/${ searchedGoodInPages.length }`,
                                ...carousel,
                            })

                            const menuPages = [exitPageMarkup]

                            if (activePage + 1 < searchedGoodInPages.length)
                                menuPages.unshift(nextPageMarkup)

                            ctx.send({
                                message: '📄 Меню управления страницами',
                                keyboard: keyboard(menuPages)
                            })
                            //

                            // Для каждого товара увеличить счетчик просмотра
                            searchedGoodInPages[activePage].forEach(async ({ _id }) =>
                                await Good.findOneAndUpdate({ _id }, { $inc: { 'views': 1 } })
                            )

                            // Увеличить статистику пользователя по поискам
                            await incrementSearch(ctx.senderId)
                    } else {
                        if (config.has('messages.search.notFound'))
                            ctx.send(config.get('messages.search.notFound'))
                        else
                            ctx.send(`❗ Мы ничего не нашли на нашей площадке. Попробуй воспользоваться другим методом поиска или поставь другие фильтры.`)

                        return ctx.scene.step.go(0)
                    }

                    // Обновить общую статистику бота
                    await BotConfig.updateOne({ $inc: { 'stats.countSearch': 1 } })

                    return
                }

                if (ctx.text == 'Следующая страница') {
                    const searchedGoodInPages = ctx.scene.state.searchedGoodInPages

                    ctx.scene.state.activePage += 1
                    const activePage = ctx.scene.state.activePage

                    if (activePage + 1 > searchedGoodInPages.length) {
                        return ctx.send({
                            message: '❗ Товаров больше нет',
                            keyboard: keyboard([exitPageMarkup])
                        })                     
                    }

                    const carousel = await getCarousel(searchedGoodInPages[activePage])

                    await ctx.send({
                        message: `📄 Страница ${ activePage + 1 }/${ searchedGoodInPages.length }`,
                        ...carousel,
                    })

                    const menuPages = [exitPageMarkup]

                    if (activePage + 1 < searchedGoodInPages.length)
                        menuPages.unshift(nextPageMarkup)

                    ctx.send({
                        message: '📄 Меню управления страницами',
                        keyboard: keyboard(menuPages)
                    })

                    // Для каждого товара увеличить счетчик просмотра
                    searchedGoodInPages[activePage].forEach(async ({ _id }) =>
                        await Good.findOneAndUpdate({ _id }, { $inc: { 'views': 1 } })
                    )

                    return
                }
                
                if (ctx.text == 'Закончить просмотр') {
                    ctx.send('❗ Перенаправляю тебя в меню поиска')
                    return ctx.scene.step.next()
                }   

                
            } catch (e) {
                console.log(e)
                ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                return ctx.scene.leave()
            }
		},
        // Подписка на поиск
        async ctx => {
            if (ctx.state.user.extendedAccess == null)
                return ctx.scene.step.go(0)

            const { userQuery } = ctx.scene.state

            if (userQuery.type !== 'link')
                return ctx.scene.step.go(0)   

            if (ctx.scene.step.firstTime || !ctx.text) 
                return ctx.send({
                    message: '✉️ У тебя есть возможность подписаться на поиск этого товара. Бот сам напишет тебе, когда найдет товар по твоим параметрам.',
                    keyboard: keyboard(subscribeSearch)
                })


            if (ctx.text == 'Пропустить')
                return ctx.scene.step.go(0)

            if (ctx.text == 'Подписаться') {
                try {
                    const { userQuery, sizeRange, range: priceRange } = ctx.scene.state

                    const mailingIsExists = await MailingUser.findOne({
                        userId: ctx.senderId,
                        type: 'subscribeSearch',
                        'data.userQuery.value': userQuery.value
                    })

                    console.log(mailingIsExists);

                    if (mailingIsExists) {
                        ctx.send('❌ Ты уже был подписан на этот товар. Удалить подписку можно в профиле')
                        return ctx.scene.step.go(0)     
                    }


                    const mailingUser = new MailingUser({
                        userId: ctx.senderId,
                        type: 'subscribeSearch',
                        groupId: config.get('groupID'),
                        data: {
                            userQuery, 
                            sizeRange, 
                            priceRange: {
                                min: priceRange[0],
                                max: priceRange[1]
                            }
                        }
                    })

                    await mailingUser.save()

                    ctx.send('✉️ Ты успешно подписался на поиск товара. Отслеживать свои подписки можно в профиле')
                    return ctx.scene.step.go(0)                    
                } catch (e) {
                    console.log(e)
                    ctx.send('❗ Произошла какая-то ошибка, обратитесь к главному администратору')
                    return ctx.scene.leave()
                }
            }
                
        }
	])	
]

export default searchScene