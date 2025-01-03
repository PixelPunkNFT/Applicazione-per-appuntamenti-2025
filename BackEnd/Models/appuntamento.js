const mongoose = require('mongoose');

const appuntamentoSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    operator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Operator',
        required: true
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    orario: {
        type: String,
        required: true
    },
    nomeCliente: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    nota: {
        type: String,
        required: false
    },
    stato: {
        type: String,
        enum: ['attivo', 'disdetto'],
        default: 'attivo'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Appuntamento', appuntamentoSchema);
