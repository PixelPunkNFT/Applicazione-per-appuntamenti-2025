const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    status: {
        type: String,
        enum: ['active', 'inactive', 'past_due', 'canceled'],
        default: 'inactive'
    },
    currentPeriodEnd: Date
});

const userSchema = new mongoose.Schema({
    subscription: subscriptionSchema,
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
