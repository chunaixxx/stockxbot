import mongoose from 'mongoose'
import dotenv from 'dotenv'
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
)
