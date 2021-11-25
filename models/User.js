import mongoose from 'mongoose'
const Schema = mongoose.Schema

const goodSchema = new Schema({
	userId: {
		type: String,
		required: true,
	},

	username: {
		type: String,
		required: true,
	},

	extendedAccess: { 
		type: Boolean, 
		default: false
	},

	adminAccess: { 
		type: Boolean, 
		default: false
	},

	searchInfo: {
		count: {
			type: Number,
			default: 0
		},

		lastSearch: {
			type: Date,
			default: null
		}
	}
})

const User = mongoose.model('User', goodSchema)

export default User