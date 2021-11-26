import BotConfig from '../models/BotConfig.js'
import getUserName from '../utils/getUserName.js'
import convertDate from '../utils/convertDate.js'

import fs from 'fs';
const fsPromises = fs.promises;

const logAdminActions = async (id, action, userID) => {
    try {
        const { firstname, lastname} = await getUserName(id)
        const dateOfAction = Date.now()
        const adminID = id
    
        console.log()
    
        const newAction = {} 
        newAction[`lastAdminActions.${action}`] = {
            adminName: `${ firstname } ${ lastname }`,
            adminID,                    
            dateOfAction,
            userID
        }
    
        await fsPromises.appendFile('./logs/adminAction.log', `[${convertDate(dateOfAction)}] ${action} | ${ firstname } ${ lastname } (AdminID ${adminID}) | UserID ${userID}\n`)
    
        await BotConfig.updateOne({
            $set: newAction
        })   
    } catch (e) {
        console.log(e)
    }

}

export default logAdminActions