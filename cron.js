import config from 'config'
import cron from 'cron'
import moment from 'moment'
import vk from './commonVK'
import BotConfig from './models/BotConfig'

import MailingUser from './models/MailingUser'

const CronJob = cron.CronJob

const job = new CronJob(
    '0 0 15 * * 6',
    //'*/10 * * * * 0',
	async () => {
        try {
            const botConfig = await BotConfig.findOne()
    
            const nowDate = moment()
            const lastDate = moment(botConfig.stats.archiving.lastDate)

            if (nowDate - lastDate > 86400000 * 8) {
                const mailingArchiveUsers = await MailingUser.find({ type: 'archive', groupId: config.get('groupID') })

                mailingArchiveUsers.forEach(async user => {
                    try {
                        await vk.api.messages.send({
                            user_id: +user.userId,
                            random_id: Date.now(),
                            message: '⚠️ Не забудь обновить свои товары, иначе сегодня ночью они пропадут из поиска. Отключить рассылку можно в профиле'
                        })
                    } catch (e) {
                        console.log(e.code)
                    }
                })      
            }
        } catch (e) {
            console.log(e)
        }
    },
	null,
	true,
	'Europe/Moscow'
)