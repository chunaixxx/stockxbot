import mongoose from 'mongoose'
const Schema = mongoose.Schema

const promocodeUserSchema = new Schema({
	promocode: {
		type: String,
		required: true,
        unique: true
	},

    days: {
        type: Number,
        required: true
    },

    activated: {
        type: Object,
        default: null
    },
})

const MailingUser = mongoose.model('Promocode', promocodeUserSchema)

export default MailingUser
