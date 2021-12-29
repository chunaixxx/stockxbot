import mongoose from 'mongoose'
const Schema = mongoose.Schema

const cachedGoodSchema = new Schema({
    url: {
		type: String,
		required: true
	},

	name: { 
		type: String,
		index: true,
		required: true
	},

	imgUrl: { 
		type: String,
		required: true
	},

    filename: { 
		type: String,
		required: true
	},

	allSizes: { 
		type: Array, 
		default: null
	},
})

const CachedGood = mongoose.model('CachedGood', cachedGoodSchema)

export default CachedGood
