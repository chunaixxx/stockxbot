import mongoose from 'mongoose'
const Schema = mongoose.Schema

const goodSchema = new Schema({
	sellerId: {
		type: String,
		required: true,
	},

	sellerName: { 
		type: String, 
		required: true
	},

	goodName: { 
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

	link: {
		type: String,
		required: true
	},

	size: { 
		type: String, 
		default: null
	 },

	price: { 
		type: Number, 
		required: true 
	},
	
	city: {
		type: String,
		required: true,
	},

    hasDelivery: {
		type: String,
		required: true,
	},

    hasFitting: {
		type: String,
		default: null,
	},

	views: {
		type: Number,
		default: 0,
	},
})

goodSchema.index({ goodName: 'text' })

const Good = mongoose.model('Good', goodSchema)

export default Good
