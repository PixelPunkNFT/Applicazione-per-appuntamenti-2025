const mongoose = require('mongoose');

const operatorServiceSchema = new mongoose.Schema({
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    duration: {
        type: Number, // durata in minuti
        required: true
    }
});

const operatorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    services: [operatorServiceSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Operator', operatorSchema);
