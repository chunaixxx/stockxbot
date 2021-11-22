import mongoose from 'mongoose'
const Schema = mongoose.Schema

const goodSchema = new Schema({
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
})

const User = mongoose.model('User', goodSchema)

export default User