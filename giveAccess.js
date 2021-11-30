import mongoose from 'mongoose'
import dotenv from 'dotenv'

import BotConfig from './models/BotConfig.js'
import User from './models/User.js';

dotenv.config()

mongoose.connect(
	process.env.MONGO_URL,
	{
		useUnifiedTopology: true,
		useNewUrlParser: true,
	},
	e => {
        if (e)
            console.log(e)
        else
            console.log('БД запущена')
    }
);

(async () => {
	const foundBotConfig = await BotConfig.findOne()

	if (!foundBotConfig) {
		const newBotConfig = new BotConfig()
		await newBotConfig.save()
	}

})()


const giveAccess = async () => {
    await User.updateOne({ userId: '370543365'}, { $set: { settingsAccess: true }})
    await User.updateOne({ userId: '163049276'}, { $set: { settingsAccess: true }})
}

giveAccess()