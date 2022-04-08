import moment from 'moment'

import ExtendedUser from '../models/ExtendedUser'
import MailingUser from '../models/MailingUser'
import Good from '../models/Good'
import User from '../models/User'
import BannedUser from '../models/BannedUser'
import BotConfig from '../models/BotConfig'

import logAdminActions from '../utils/logAdminActions'

export const findExtendedUser = async userId => {
    const user = await ExtendedUser.findOne({ userId })

    return user
}

export const giveExtendedAccess = async ({ adminId, userId, days, forever }) => {
	try {
		const userIsExist = !!(await findExtendedUser(userId))

		if (userIsExist) {
			return { message: '❗ Пользователь уже имеет PRO-версию' }
		} else {
            const optionsNewExtendedUser = {
                userId,
                givenAt: Date.now()
            }

            if (forever) {
                optionsNewExtendedUser.forever = true
                optionsNewExtendedUser.expiresAt = null
            } else {
                optionsNewExtendedUser.expiresAt = moment().add(days, 'days')
            }

			const newExtendedUser = new ExtendedUser(optionsNewExtendedUser)

			await newExtendedUser.save()

            if (adminId) {
                await logAdminActions({ 
                    adminId, 
                    userId,
                    action: 'giveExtendedAccess'
                })
            }

			return { message: '❗ PRO-версия успешно выдана' }
		}
	} catch (e) {
		console.log(e)
		return { message: '❗ Произошла какая-то ошибка, обратитесь к главному администратору' }
	}
}

export const extendExtendedAccess = async ({ adminId, userId, days, forever }) => {
    try {
        const extendedUser = await findExtendedUser(userId)
        const userIsExist = !!extendedUser

        if (userIsExist) {
            if (extendedUser.forever) {
                return { message: '❗ У этого пользователя пожизненная PRO-версия' }
            } else {
                if (forever) {
                    await ExtendedUser.updateOne(
                        { userId },
                        {
                            expiresAt: null,
                            forever: true
                        }
                    )
                } else {
                    const expiresAt = extendedUser.expiresAt
                    const newExpiresAt = moment(expiresAt).add(days, 'days')

                    await ExtendedUser.updateOne(
                        { userId },
                        { expiresAt: newExpiresAt }
                    )
                }
            }

            if (adminId) {
                await logAdminActions({ 
                    adminId, 
                    userId,
                    action: 'extendExtendedAccess'
                })
            }

			return { message: '❗ PRO-версия успешно продлена' }
		} else {
			return { message: '❗ У пользователя нет PRO-версии' }
		}
    } catch (e) {
        console.log(e)
        return { message: '❗ Произошла какая-то ошибка, обратитесь к главному администратору' }
    }
}

export const takeExtendedAccess = async ({ adminId, userId }) => {
	try {
		const userIsExist = !!(await findExtendedUser(userId))

		if (userIsExist) {
            await ExtendedUser.deleteOne({ userId })

            await MailingUser.deleteMany({
                type: 'subscribeSearch',
                userId
            })

            await logAdminActions({ 
                adminId, 
                userId,
                action: 'takeExtendedAccess'
            })

            const botConfig = await BotConfig.findOne()

            await User.updateOne(
                { userId },
                {
                    freeSearch: botConfig.maxSearch,
                    freeSell: botConfig.maxGoods
                }
            )

            await Good.updateMany(
                { sellerId: userId },
                { desc: null }
            )

			return { message: '❗ PRO-версия успешно удалена' }
		} else {
            return { message: '❗ У пользователя нет PRO-версии' }
		}
	} catch (e) {
		console.log(e)
		return { message: '❗ Произошла какая-то ошибка, обратитесь к главному администратору' }
	}
}

export const deleteAllAds = async ({ adminId, userId }) => {
    try {
        await logAdminActions({ adminId, userId, action: 'deleteAllGoods'})
        await Good.deleteMany({ sellerId: userId })
        
        return { message: '❗ У пользователя удалены все объявления' }
    } catch (e) {
        console.log(e)
        return { message: '❗ Произошла какая-то ошибка, обратитесь к главному администратору' }
    }
}

export const giveAdminAccess = async ({ userId }) => {
    try {
        await User.updateOne(
            { userId },
            { $set: { adminAccess: true } }
        )
        
        return { message: '❗ Пользователю выданы права администратора' }
    } catch (e) {
        console.log(e)
        return { message: '❗ Произошла какая-то ошибка, обратитесь к главному администратору' }
    }
}

export const takeAdminAccess = async ({ userId }) => {
    try {
        await User.updateOne(
            { userId },
            { $set: { adminAccess: false } }
        )
        
        return { message: '❗ У пользователя сняты полномочия администратора' }
    } catch (e) {
        console.log(e)
        return { message: '❗ Произошла какая-то ошибка, обратитесь к главному администратору' }
    }
}

export const banUser = async ({ adminId, userId, reason }) => {
    try {
        await Good.updateMany(
            { sellerId: userId },
            { $set: { isHide: true } }
        )

        const bannedUser = new BannedUser({
            userId,
            expiresIn: Date.now(),
            reason
        })

        await bannedUser.save()

        await logAdminActions({ adminId, userId, action: 'banUser'})

        return { message: '❗ Пользователь заблокирован' }
    } catch (e) {
        console.log(e)
        return { message: '❗ Произошла какая-то ошибка, обратитесь к главному администратору' }
    }          
}

export const unbanUser = async ({ adminId, userId }) => {
    try {
        await BannedUser.deleteOne({ userId })
        await logAdminActions({ adminId, userId, action: 'unbanUser'})

        return { message: '❗ Пользователь разблокирован' }
    } catch (e) {
        console.log(e)
        return { message: '❗ Произошла какая-то ошибка, обратитесь к главному администратору' }
    }           
}