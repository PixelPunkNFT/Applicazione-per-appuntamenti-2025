require('dotenv').config();
const mongoose = require('mongoose');
const Appuntamento = require('./Models/appuntamento');
const User = require('./Models/user');

async function updateAppointmentsEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connesso a MongoDB');

    // Trova tutti gli appuntamenti che non hanno l'email
    const appuntamenti = await Appuntamento.find({ email: { $exists: false } });
    console.log(`Trovati ${appuntamenti.length} appuntamenti da aggiornare`);

    for (const appuntamento of appuntamenti) {
      // Trova l'utente associato all'appuntamento
      const user = await User.findById(appuntamento.userId);
      if (user && user.email) {
        // Aggiorna l'appuntamento con l'email dell'utente
        await Appuntamento.findByIdAndUpdate(appuntamento._id, { email: user.email });
        console.log(`Aggiornato appuntamento ${appuntamento._id} con email ${user.email}`);
      }
    }

    console.log('Aggiornamento completato');
    process.exit(0);
  } catch (error) {
    console.error('Errore durante l\'aggiornamento:', error);
    process.exit(1);
  }
}

updateAppointmentsEmail();
