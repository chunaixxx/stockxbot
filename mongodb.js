import mongoose from 'mongoose'
import dotenv from 'dotenv'

import BotConfig from './models/BotConfig.js'

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


