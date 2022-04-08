import Promocode from '../models/Promocode'

import { giveExtendedAccess, extendExtendedAccess } from './manageUser'

export const activatePromocode = async (promocode, user) => {
    try {
        const foundPromocode = await Promocode.findOne({ promocode })

        if (foundPromocode && foundPromocode.activated == null) {
            const isForeverPromocode = foundPromocode.days == 0
    
            if (user.extendedAccess == null) {
                await giveExtendedAccess({
                    adminId: null,
                    userId: user.userId,
                    days: foundPromocode.days,
                    forever: isForeverPromocode,
                })
    
                await Promocode.updateOne(
                    { promocode },
                    { 
                        activated: {
                            userId: user.userId,
                            username: user.username
                        }
                    }
                )
    
                if (isForeverPromocode) {
                    return { message: '🚀 Вы активировали промокод и получили пожизненную PRO-версию' }
                } else {
                    return { message: `🚀 Вы активировали промокод и получили PRO-версию на ${ foundPromocode.days } дней` }
                }
            } else {
                if (user.extendedAccess.expiresAt == null)
                    return

                await extendExtendedAccess({
                    adminId: null,
                    userId: user.userId,
                    days: foundPromocode.days,
                    forever: isForeverPromocode,
                })
    
                await Promocode.updateOne(
                    { promocode },
                    { 
                        activated: {
                            userId: user.userId,
                            username: user.username
                        }
                    }
                )
    
                if (isForeverPromocode) {
                    return { message: '🚀 Вы активировали промокод и продлили свою PRO-версию навсегда' }
                } else {
                    return { message: `🚀 Вы активировали промокод и продлили PRO-версию на ${ foundPromocode.days } дней` }
                }
            }
        }  
    } catch (e) {
        console.log(e)
    }
}

export const createPromocode = async (promocode, days) => {
	try {
		const newPromocode = new Promocode({ promocode, days })

		await newPromocode.save()
	} catch (e) {
		console.log(e)
	}
}

export const deletePromocode = async promocode => {
	try {
		await Promocode.deleteOne({ promocode })
	} catch (e) {
		console.log(e)
	}
}
