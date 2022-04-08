import BotConfig from '../models/BotConfig.js'
import getUserName from '../utils/getUserName.js'
import convertDate from '../utils/convertDate.js'

import fs from 'fs';
const fsPromises = fs.promises;

const logAdminActions = async ({ adminId, userId, action }) => {
    try {
        const { firstname, lastname} = await getUserName(adminId)
        const dateOfAction = Date.now()
    
        const newAction = {} 
        newAction[`lastAdminActions.${action}`] = {
            adminName: `${ firstname } ${ lastname }`,
            adminId,                    
            dateOfAction,
            userId
        }
    
        await fsPromises.appendFile('./logs/adminAction.log', `[${convertDate(dateOfAction)}] ${action} | ${ firstname } ${ lastname } (AdminID ${adminId}) | UserID ${userId}\n`)
    
        await BotConfig.updateOne({
            $set: newAction
        })   
    } catch (e) {
        console.log(e)
    }

}

export default logAdminActions