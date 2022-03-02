import mongoose from 'mongoose'
const Schema = mongoose.Schema

const mailingUserSchema = new Schema({
	userId: {
		type: String,
		required: true,
	},

	type: {
		type: String,
		required: true,
	},

	groupId: {
		type: Number,
		required: true,
	},
})

const MailingUser = mongoose.model('MailingUser', mailingUserSchema)

export default MailingUser
