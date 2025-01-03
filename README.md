# Sistema di Gestione Appuntamenti e Abbonamenti

Un'applicazione web moderna e completa per la gestione professionale degli appuntamenti e degli abbonamenti, costruita con React e Node.js.

## 🚀 Caratteristiche Principali

- **Autenticazione Sicura**
  - Login tramite Google OAuth 2.0
  - Gestione token JWT per la sicurezza delle sessioni
  - Sistema di ruoli (utente/amministratore/operatore)
  - Protezione avanzata delle rotte


- **Gestione Appuntamenti**
  - Prenotazione appuntamenti in tempo reale
  - Visualizzazione calendario con slot disponibili
  - Sistema automatico anti-sovrapposizione
  - Gestione cancellazioni con mantenimento storico
  - Storico appuntamenti passati
  - Sezione dedicata agli appuntamenti disdetti
  - Notifiche email automatiche per appuntamenti
  - Assegnazione automatica agli operatori disponibili

- **Pannello Amministratore**
  - Gestione completa dei servizi offerti
  - Monitoraggio appuntamenti attivi e disdetti
  - Gestione utenti e promozione amministratori
  - Dashboard con statistiche e overview
  - Gestione operatori e loro disponibilità
  - Monitoraggio abbonamenti attivi

- **Gestione Operatori**
  - Pannello dedicato per la gestione operatori
  - Assegnazione servizi agli operatori
  - Gestione disponibilità e orari
  - Monitoraggio performance

- **Gestione Servizi**
  - Creazione e modifica servizi
  - Definizione durata servizi
  - Protezione servizi con appuntamenti attivi
  - Assegnazione servizi a operatori specifici
  - Prezzi differenziati per abbonati/non abbonati

- **Privacy e Conformità**
  - Gestione completa dei cookie
  - Privacy Policy integrata
  - Banner cookie personalizzabile
  - Conformità GDPR
  - Gestione consensi utente

- **Sistema di Notifiche**
  - Notifiche email automatiche per appuntamenti
  - Promemoria appuntamenti
  - Notifiche di cancellazione
  - Notifiche di modifica stato abbonamento
  - Notifiche amministrative

## 🛠 Tecnologie Utilizzate

### Backend
- Node.js + Express.js
- MongoDB con Mongoose
- Passport.js per OAuth
- JWT per l'autenticazione
- Stripe per gli abbonamenti
- Nodemailer per le email
- Cors per la sicurezza
- Cron jobs per operazioni automatiche

### Frontend
- React 18
- React Router per la navigazione
- Axios per le chiamate API
- Formik per la gestione dei form
- React Calendar per il calendario
- Framer Motion per le animazioni
- Stripe Elements per i pagamenti
- CSS moderno per lo styling

## 📋 Prerequisiti

- Node.js (v14 o superiore)
- MongoDB
- Account Google Cloud Platform per OAuth
- Account Gmail per le notifiche email
- Account Stripe per gli abbonamenti

## ⚙️ Installazione

1. **Clona il repository**
   ```bash
   git clone [url-repository]
   ```

2. **Configurazione Backend**
   ```bash
   cd BackEnd
   npm install
   ```
   Crea un file `.env` con le seguenti variabili:
   ```
   MONGODB_URI=your_mongodb_uri
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_app_password
   ```

3. **Configurazione Frontend**
   ```bash
   cd FrontEnd
   npm install
   ```
   Crea un file `.env` con:
   ```
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
   ```

## 🚀 Avvio dell'Applicazione

1. **Avvia il Backend**
   ```bash
   cd BackEnd
   npm start
   ```
   Il server sarà in ascolto sulla porta 5000

2. **Avvia il Frontend**
   ```bash
   cd FrontEnd
   npm start
   ```
   L'applicazione sarà disponibile su http://localhost:3000

## 🔒 Configurazione Iniziale

1. Accedi all'applicazione con il tuo account Google
2. Utilizza l'endpoint temporaneo per creare il primo amministratore:
   ```bash
   curl -X POST http://localhost:5000/create-first-admin -H "Content-Type: application/json" -d '{"email":"tuo@email.com"}'
   ```
3. Accedi come amministratore per configurare:
   - Servizi disponibili
   - Operatori e loro disponibilità
   - Piani di abbonamento su Stripe
   - Impostazioni email

## 📱 Funzionalità per Tipo Utente

### Utenti Standard
- Prenotazione appuntamenti
- Visualizzazione e gestione appuntamenti personali
- Storico appuntamenti passati
- Cancellazione appuntamenti
- Gestione profilo personale
- Gestione abbonamenti
- Accesso a tariffe speciali (se abbonati)

### Operatori
- Visualizzazione appuntamenti assegnati
- Gestione disponibilità
- Gestione servizi assegnati
- Storico appuntamenti completati

### Amministratori
- Tutte le funzionalità degli utenti standard
- Gestione completa dei servizi
- Visualizzazione di tutti gli appuntamenti
- Gestione utenti e ruoli
- Gestione operatori
- Monitoraggio abbonamenti
- Accesso alle statistiche
- Monitoraggio appuntamenti disdetti
- Configurazione sistema email
- Gestione banner cookie e privacy

## 🔄 Processi Automatici

- Aggiornamento stato abbonamenti
- Invio email di promemoria
- Pulizia appuntamenti scaduti
- Backup automatico database
- Sincronizzazione con Stripe

## 🤝 Contribuire

Le pull request sono benvenute. Per modifiche importanti, apri prima un issue per discutere cosa vorresti cambiare.

## 📄 Licenza

[MIT](https://choosealicense.com/licenses/mit/)

## 🔐 Sicurezza

Per segnalare vulnerabilità di sicurezza, invia una email a [indirizzo-email].
Non divulgare pubblicamente i problemi di sicurezza prima che siano stati risolti.
