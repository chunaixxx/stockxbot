import BotConfig from '../models/BotConfig.js'
import getUserName from '../utils/getUserName.js'
import convertDate from '../utils/convertDate.js'

 const logAdminActions = async (id, action, userID) => {
    const { firstname, lastname} = await getUserName(id)
    const dateOfAction = Date.now()
    const adminID = id

    console.log(convertDate(dateOfAction))

    const newAction = {} 
    newAction[`lastAdminActions.${action}`] = {
        adminName: `${ firstname } ${ lastname }`,
        adminID,                    
        dateOfAction,
        userID
    }

    await BotConfig.updateOne({
        $set: newAction
    })
}

export default logAdminActions