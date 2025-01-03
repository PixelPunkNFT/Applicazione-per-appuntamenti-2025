require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/user');

async function updateUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connesso a MongoDB');

        // Aggiorna tutti gli utenti che non hanno un ruolo impostato
        const result = await User.updateMany(
            { role: { $exists: false } },
            { $set: { role: 'user' } }
        );

        console.log(`Aggiornati ${result.modifiedCount} utenti`);

        // Mostra tutti gli utenti e i loro ruoli
        const users = await User.find({}, 'email role');
        console.log('\nStato attuale degli utenti:');
        users.forEach(user => {
            console.log(`Email: ${user.email}, Ruolo: ${user.role}`);
        });

    } catch (error) {
        console.error('Errore durante l\'aggiornamento:', error);
    } finally {
        await mongoose.connection.close();
    }
}

updateUsers();
