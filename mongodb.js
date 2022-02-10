import config from 'config'
import mongoose from 'mongoose'

import BotConfig from './models/BotConfig.js'

mongoose.connect(
	config.get('mongoURL'),
	{ useUnifiedTopology: true, useNewUrlParser: true },
	e => {
		if (e) console.log(e)
		else console.log('БД запущена')
	}
)

// Generate BotConfig
;(async () => {
	const foundBotConfig = await BotConfig.findOne()

	if (!foundBotConfig) {
		const newBotConfig = new BotConfig()
		await newBotConfig.save()
	}
})()
