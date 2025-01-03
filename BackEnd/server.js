require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Appuntamento = require('./Models/appuntamento');
const User = require('./Models/user');
const Service = require('./Models/service');
const Operator = require('./Models/operator');
const Cookie = require('./Models/cookie');

const app = express();

// Configura CORS con opzioni specifiche
app.use(cors({
  origin: 'http://localhost:3000', // URL del frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: true // Importante per le richieste con credenziali
}));

// Endpoint di ping per verificare la connessione
app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Configura il middleware per gestire sia JSON che raw body
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Endpoint per salvare i cookie nel database
app.post('/cookies', async (req, res) => {
  try {
    console.log('=== Inizio elaborazione richiesta POST /cookies ===');
    console.log('Headers completi:', JSON.stringify(req.headers, null, 2));
    console.log('Body completo:', JSON.stringify(req.body, null, 2));
    
    const { technical, analytics, marketing, timestamp } = req.body;
    
    // Validazione dei dati ricevuti
    if (technical === undefined || analytics === undefined || marketing === undefined) {
      console.error('Dati mancanti nella richiesta');
      return res.status(400).json({ 
        message: 'Dati incompleti',
        required: ['technical', 'analytics', 'marketing'],
        received: req.body
      });
    }

    // Ottieni l'IP del client con fallback
    const userIp = req.headers['x-forwarded-for'] || 
                  req.headers['x-real-ip'] || 
                  req.connection.remoteAddress || 
                  '0.0.0.0';
    console.log('IP client rilevato:', userIp);

    const cookieData = {
      technical,
      analytics,
      marketing,
      timestamp: timestamp || new Date().toISOString(),
      userIp
    };
    console.log('Dati cookie preparati per il salvataggio:', cookieData);

    // Cerca un record esistente con lo stesso IP
    let existingCookie = await Cookie.findOne({ userIp });
    
    let savedCookie;
    if (existingCookie) {
      console.log('Trovato cookie esistente per IP:', userIp);
      // Aggiorna il record esistente
      existingCookie.technical = technical;
      existingCookie.analytics = analytics;
      existingCookie.marketing = marketing;
      existingCookie.timestamp = timestamp || new Date().toISOString();
      savedCookie = await existingCookie.save();
      console.log('Cookie aggiornato con successo');
    } else {
      console.log('Creazione nuovo record cookie per IP:', userIp);
      const cookie = new Cookie(cookieData);
      savedCookie = await cookie.save();
      console.log('Nuovo cookie salvato con successo');
    }

    console.log('Dettagli cookie salvato:', JSON.stringify(savedCookie, null, 2));
    console.log('=== Fine elaborazione richiesta POST /cookies ===');
    
    res.status(201).json({ 
      message: 'Cookie salvati con successo',
      data: savedCookie
    });
  } catch (error) {
    console.error('Errore dettagliato nel salvataggio dei cookie:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Errore nel salvataggio dei cookie',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


app.use(passport.initialize());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      // Cerca l'utente nel database o creane uno nuovo
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          role: 'user' // Impostiamo esplicitamente il ruolo
        });
        console.log('Nuovo utente creato:', {
          id: user._id,
          email: user.email,
          role: user.role
        });
      }
      
      return cb(null, user);
    } catch (error) {
      return cb(error, null);
    }
  }
));

// Middleware per verificare il token JWT
const authenticateToken = async (req, res, next) => {
  console.log('Headers ricevuti:', req.headers);
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Token estratto:', token);

  if (!token) {
    console.log('Nessun token fornito');
    return res.status(401).json({ message: 'Token non fornito' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificato:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Errore nella verifica del token:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token scaduto' });
    }
    return res.status(403).json({ 
      message: 'Token non valido',
      error: err.message 
    });
  }
};

// Inizia il flusso di autenticazione Google
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback URL per Google OAuth
app.get('/auth/google/callback', 
  passport.authenticate('google', { session: false }),
  (req, res) => {
    console.log('User da Google:', req.user);
    console.log('User ID:', req.user._id);
    console.log('User ID (toString):', req.user._id.toString());
    
    // Genera token JWT includendo il ruolo
    const token = jwt.sign(
      { 
        id: req.user._id.toString(), // Converti l'ObjectId in stringa
        email: req.user.email,
        name: req.user.name,
        role: req.user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Token generato:', token);
    
    // Redirect al frontend con il token
    res.redirect(`http://localhost:3000/auth-callback?token=${token}`);
  }
);

// Endpoint per verificare se l'utente è admin
app.get('/check-admin', authenticateToken, async (req, res) => {
  try {
    console.log('Token decodificato:', req.user);
    const user = await User.findById(req.user.id);
    console.log('Utente trovato:', user);
    
    if (!user) {
      console.log('Utente non trovato nel database');
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    
    console.log('Ruolo utente:', user.role);
    const hasActiveSubscription = user.role === 'admin' && 
      user.subscription && 
      user.subscription.status === 'active';

    res.json({ 
      isAdmin: user.role === 'admin',
      hasActiveSubscription: hasActiveSubscription
    });
  } catch (error) {
    console.error('Errore nel check-admin:', error);
    res.status(500).json({ 
      message: 'Errore nel controllo del ruolo admin',
      error: error.message 
    });
  }
});

// Endpoint per impostare un utente come admin (protetto, solo admin può farlo)
app.post('/set-admin', authenticateToken, async (req, res) => {
  try {
    // Verifica che chi fa la richiesta sia admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin' || !adminUser.subscription?.status === 'active') {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email richiesta' });
    }

    // Trova l'utente da promuovere
    const userToPromote = await User.findOne({ email });
    if (!userToPromote) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // Imposta il ruolo admin
    userToPromote.role = 'admin';
    await userToPromote.save();

    res.json({ message: 'Utente promosso ad admin con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore durante la promozione ad admin' });
  }
});

// Endpoint per ottenere tutti i servizi
app.get('/services', authenticateToken, async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    console.error('Errore nel recupero dei servizi:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero dei servizi',
      error: error.message 
    });
  }
});

// Endpoint per creare un nuovo servizio
app.post('/services', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin' || !user.subscription?.status === 'active') {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const { name, duration, description } = req.body;
    const newService = new Service({
      name,
      duration,
      description
    });

    await newService.save();
    res.status(201).json(newService);
  } catch (error) {
    console.error('Errore nella creazione del servizio:', error);
    res.status(500).json({ 
      message: 'Errore nella creazione del servizio',
      error: error.message 
    });
  }
});

// Endpoint per ottenere tutti gli operatori
app.get('/operators', authenticateToken, async (req, res) => {
  try {
    const operators = await Operator.find()
      .populate('services.service')
      .sort({ createdAt: -1 });
    res.json(operators);
  } catch (error) {
    console.error('Errore nel recupero degli operatori:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero degli operatori',
      error: error.message 
    });
  }
});

// Endpoint per creare un nuovo operatore (solo admin)
app.post('/operators', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin' || !user.subscription?.status === 'active') {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const { name, services } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Nome operatore richiesto' });
    }

    const newOperator = new Operator({ 
      name,
      services: services || []
    });
    await newOperator.save();
    res.status(201).json(newOperator);
  } catch (error) {
    if (error.code === 11000) { // Errore di duplicato (nome già esistente)
      return res.status(400).json({ message: 'Un operatore con questo nome esiste già' });
    }
    console.error('Errore nella creazione dell\'operatore:', error);
    res.status(500).json({ 
      message: 'Errore nella creazione dell\'operatore',
      error: error.message 
    });
  }
});

// Endpoint per aggiornare i servizi di un operatore
app.put('/operators/:id/services', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin' || !user.subscription?.status === 'active') {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const { services } = req.body;
    const operator = await Operator.findById(req.params.id);
    
    if (!operator) {
      return res.status(404).json({ message: 'Operatore non trovato' });
    }

    operator.services = services;
    await operator.save();
    
    const updatedOperator = await Operator.findById(req.params.id).populate('services.service');
    res.json(updatedOperator);
  } catch (error) {
    console.error('Errore nell\'aggiornamento dei servizi dell\'operatore:', error);
    res.status(500).json({ 
      message: 'Errore nell\'aggiornamento dei servizi dell\'operatore',
      error: error.message 
    });
  }
});

// Endpoint per eliminare un operatore (solo admin)
app.delete('/operators/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin' || !user.subscription?.status === 'active') {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const operator = await Operator.findById(req.params.id);
    if (!operator) {
      return res.status(404).json({ message: 'Operatore non trovato' });
    }

    await operator.deleteOne();
    res.json({ message: 'Operatore eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'operatore:', error);
    res.status(500).json({ 
      message: 'Errore nell\'eliminazione dell\'operatore',
      error: error.message 
    });
  }
});

// Endpoint per eliminare un servizio
app.delete('/services/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin' || !user.subscription?.status === 'active') {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Servizio non trovato' });
    }

    // Verifica se ci sono appuntamenti che usano questo servizio
    const appuntamentiConServizio = await Appuntamento.find({ service: req.params.id, stato: 'attivo' });
    
    if (appuntamentiConServizio.length > 0) {
      return res.status(400).json({ 
        message: 'Non è possibile eliminare questo servizio perché ci sono appuntamenti attivi che lo utilizzano' 
      });
    }

    // Rimuovi il servizio da tutti gli operatori che lo hanno
    await Operator.updateMany(
      { 'services.service': req.params.id },
      { $pull: { services: { service: req.params.id } } }
    );

    await service.deleteOne();
    res.json({ message: 'Servizio eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione del servizio:', error);
    res.status(500).json({ 
      message: 'Errore nell\'eliminazione del servizio',
      error: error.message 
    });
  }
});

// Endpoint per ottenere tutti gli utenti (protetto, solo admin)
app.get('/users', authenticateToken, async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin' || !adminUser.subscription?.status === 'active') {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const users = await User.find({}, 'email name role');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero degli utenti' });
  }
});

// Endpoint temporaneo per creare il primo admin
// IMPORTANTE: Rimuovere questo endpoint dopo aver creato il primo admin
app.post('/create-first-admin', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Verifica se esistono già degli admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Esiste già un admin nel sistema' });
    }

    // Trova l'utente e impostalo come admin
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    user.role = 'admin';
    await user.save();

    res.json({ message: 'Primo admin creato con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nella creazione del primo admin' });
  }
});

// Endpoint per ottenere i dettagli dell'abbonamento
app.get('/subscription-details', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    if (!user.subscription?.stripeCustomerId) {
      return res.status(404).json({ message: 'Nessun abbonamento trovato' });
    }

    const subscription = await stripe.subscriptions.list({
      customer: user.subscription.stripeCustomerId,
      limit: 1,
      status: 'active'
    });

    if (!subscription.data.length) {
      return res.status(404).json({ message: 'Nessun abbonamento attivo trovato' });
    }

    const subscriptionData = subscription.data[0];
    const product = await stripe.products.retrieve(subscriptionData.items.data[0].price.product);

    res.json({
      plan: product.name,
      status: subscriptionData.status,
      current_period_start: subscriptionData.current_period_start,
      current_period_end: subscriptionData.current_period_end
    });
  } catch (error) {
    console.error('Errore nel recupero dei dettagli dell\'abbonamento:', error);
    res.status(500).json({ message: 'Errore nel recupero dei dettagli dell\'abbonamento' });
  }
});

// Endpoint per creare una sessione del portale Stripe
app.post('/create-portal-session', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    if (!user.subscription?.stripeCustomerId) {
      return res.status(404).json({ message: 'Nessun cliente Stripe trovato' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/admin`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Errore nella creazione della sessione del portale:', error);
    res.status(500).json({ message: 'Errore nella creazione della sessione del portale' });
  }
});

// IMPORTANTE: Configurare l'URL del webhook su Stripe Dashboard per puntare a http://localhost:5000/webhook
// Webhook di Stripe per gestire gli eventi dell'abbonamento
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('Webhook ricevuto da Stripe');
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('Evento webhook ricevuto:', event.type);
  } catch (err) {
    console.error('Errore nella verifica della firma webhook:', err.message);
    console.error('Headers ricevuti:', req.headers);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Trova l'utente tramite lo stripeCustomerId
        const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
        if (!user) {
          console.error('Utente non trovato per customerId:', customerId);
          return res.status(404).json({ error: 'User not found' });
        }

        // Aggiorna i dettagli dell'abbonamento
        user.subscription.stripeSubscriptionId = subscription.id;
        user.subscription.status = subscription.status;
        user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        await user.save();
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        const deletedCustomerId = deletedSubscription.customer;
        console.log('Gestione cancellazione abbonamento per customer:', deletedCustomerId);
        
        const userToUpdate = await User.findOne({ 'subscription.stripeCustomerId': deletedCustomerId });
        if (userToUpdate) {
          console.log('Utente trovato, aggiornamento stato abbonamento a canceled');
          userToUpdate.subscription.status = 'canceled';
          await userToUpdate.save();
        } else {
          console.error('Utente non trovato per customerId:', deletedCustomerId);
        }
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Errore nella gestione dell\'evento webhook:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Endpoint per creare una sessione di checkout Stripe
app.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // Crea o recupera il cliente Stripe
    let customer;
    if (user.subscription?.stripeCustomerId) {
      customer = user.subscription.stripeCustomerId;
    } else {
      const customerData = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id
        }
      });
      customer = customerData.id;
      
      // Salva l'ID cliente Stripe
      user.subscription = {
        ...user.subscription,
        stripeCustomerId: customer
      };
      await user.save();
    }

    // Crea la sessione di checkout
    const session = await stripe.checkout.sessions.create({
      customer: customer,
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID, // ID del prezzo dell'abbonamento
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/admin?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/subscribe?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Errore nella creazione della sessione di checkout:', error);
    res.status(500).json({ message: 'Errore nella creazione della sessione di checkout' });
  }
});

// Connessione a MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connesso a MongoDB'))
.catch(err => console.error('Non è stato possibile connettersi a MongoDB', err));

// Endpoint per ottenere gli appuntamenti passati (solo admin)
app.get('/admin/appuntamenti/passati', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'admin' || !user.subscription?.status === 'active') {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const appuntamenti = await Appuntamento.find()
      .populate('service')
      .populate('operator')
      .populate('userId', 'email name')
      .sort({ date: -1, orario: 1 });

    res.json(appuntamenti);
  } catch (error) {
    console.error('Errore nel recupero degli appuntamenti passati:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero degli appuntamenti passati',
      error: error.message 
    });
  }
});

// Endpoint per ottenere gli appuntamenti disdetti (solo admin)
app.get('/appuntamenti-disdetti', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'admin' || !user.subscription?.status === 'active') {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const appuntamenti = await Appuntamento.find({ stato: 'disdetto' })
      .populate('service')
      .populate('operator')
      .populate('userId', 'email name')
      .sort({ date: -1, orario: 1 });
    res.json(appuntamenti);
  } catch (error) {
    console.error('Errore nel recupero degli appuntamenti disdetti:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero degli appuntamenti disdetti',
      error: error.message 
    });
  }
});

// Endpoint per ottenere gli orari disponibili per una data
app.get('/orari-disponibili', authenticateToken, async (req, res) => {
  try {
    const dataRichiesta = new Date(req.query.data);
    const operatorId = req.query.operatorId;
    const servizioId = req.query.servizioId;
    
    // Verifica se sono stati forniti operatore e servizio
    if (!operatorId || !servizioId) {
      return res.status(400).json({ message: 'ID operatore e ID servizio richiesti' });
    }

    // Ottieni l'operatore e verifica che offra il servizio richiesto
    const operator = await Operator.findById(operatorId).populate('services.service');
    if (!operator) {
      return res.status(404).json({ message: 'Operatore non trovato' });
    }

    const serviceInfo = operator.services.find(s => s.service._id.toString() === servizioId);
    if (!serviceInfo) {
      return res.status(404).json({ message: 'Servizio non disponibile per questo operatore' });
    }

    // Array di tutti gli orari possibili
    const tuttiOrari = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    
    // Trova tutti gli appuntamenti attivi per quell'operatore in quella data
    const appuntamentiDelGiorno = await Appuntamento.find({
      $and: [
        {
          $expr: {
            $eq: [
              { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              { $dateToString: { format: "%Y-%m-%d", date: dataRichiesta } }
            ]
          }
        },
        { operator: operatorId },
        { stato: 'attivo' }
      ]
    }).populate('service');

    // Filtra gli orari disponibili
    const orariDisponibili = tuttiOrari.filter(orario => {
      // Per la data odierna, filtra gli orari già passati
      if (dataRichiesta.toDateString() === new Date().toDateString()) {
        const [ore] = orario.split(':').map(Number);
        const oraCorrente = new Date().getHours();
        if (ore <= oraCorrente) return false;
      }

      // Verifica sovrapposizioni con appuntamenti esistenti
      return !appuntamentiDelGiorno.some(app => 
        verificaSovrapposizione(
          orario,
          serviceInfo.duration,
          app.orario,
          app.duration
        )
      );
    });

    res.json(orariDisponibili);
  } catch (error) {
    console.error('Errore nel recupero degli orari disponibili:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero degli orari disponibili',
      error: error.message 
    });
  }
});

// Endpoint per ottenere tutti gli appuntamenti (protetto)
app.get('/appuntamenti/admin', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin' || !user.subscription?.status === 'active') {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const appuntamenti = await Appuntamento.find({ stato: 'attivo' })
      .populate('service')
      .populate('operator')
      .populate('userId', 'email name')
      .sort({ date: 1, orario: 1 });
    
    res.json(appuntamenti);
  } catch (error) {
    console.error('Errore nel recupero degli appuntamenti:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero degli appuntamenti',
      error: error.message 
    });
  }
});

// Endpoint per ottenere gli appuntamenti dell'utente
app.get('/appuntamenti', authenticateToken, async (req, res) => {
  try {
    console.log('User ID dalla richiesta:', req.user.id);
    const user = await User.findById(req.user.id);
    console.log('Utente trovato:', user);
    
    if (!user) {
      console.log('Utente non trovato nel database');
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    let appuntamenti;
    const userId = new mongoose.Types.ObjectId(req.user.id);
    console.log('User ID convertito:', userId);
    console.log('User role:', user.role);
    
    if (user.role === 'admin' && user.subscription?.status === 'active') {
      console.log('Admin: recupero tutti gli appuntamenti');
      appuntamenti = await Appuntamento.find({ stato: 'attivo' })
        .populate('service')
        .populate('operator')
        .populate('userId', 'email name')
        .sort({ date: 1, orario: 1 });
    } else {
      console.log('User normale: recupero appuntamenti filtrati');
      console.log('Query filter:', { userId: userId, stato: 'attivo' });
      
      // Debug appuntamenti
      const tuttiAppuntamenti = await Appuntamento.find();
      console.log('Debug - Struttura completa appuntamenti:', tuttiAppuntamenti.map(a => {
        const appRaw = a.toObject();
        return {
          ...appRaw,
          _id: appRaw._id.toString(),
          userId: appRaw.userId ? appRaw.userId.toString() : 'N/A',
          userIdType: appRaw.userId ? typeof appRaw.userId : 'undefined',
          hasUserId: 'userId' in appRaw
        };
      }));
      
      // Ora facciamo la query filtrata usando l'operatore di confronto $eq
      appuntamenti = await Appuntamento.find({ userId: userId, stato: 'attivo' })
        .populate('service')
        .populate('operator')
        .populate('userId', 'email name')
        .sort({ date: 1, orario: 1 });
    }
    
    console.log('Appuntamenti trovati per questo utente:', appuntamenti.length);
    if (appuntamenti.length > 0) {
      try {
        console.log('Dettagli primo appuntamento:', {
          id: appuntamenti[0]._id || 'N/A',
          userId: appuntamenti[0].userId ? appuntamenti[0].userId.toString() : 'N/A',
          userIdType: appuntamenti[0].userId ? typeof appuntamenti[0].userId : 'N/A',
          data: appuntamenti[0].date || 'N/A',
          nomeCliente: appuntamenti[0].nomeCliente || 'N/A'
        });
      } catch (err) {
        console.log('Errore nel log dei dettagli del primo appuntamento:', err.message);
      }
    }
    
    res.json(appuntamenti);
  } catch (error) {
    console.error('Errore nel recupero degli appuntamenti:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero degli appuntamenti',
      error: error.message 
    });
  }
});

// Funzione helper per convertire orario stringa in minuti
const orarioToMinuti = (orario) => {
  const [ore, minuti] = orario.split(':').map(Number);
  return ore * 60 + minuti;
};

// Funzione helper per verificare sovrapposizione tra appuntamenti
const verificaSovrapposizione = (orario1, durata1, orario2, durata2) => {
  const inizio1 = orarioToMinuti(orario1);
  const fine1 = inizio1 + durata1;
  const inizio2 = orarioToMinuti(orario2);
  const fine2 = inizio2 + durata2;

  return (inizio1 < fine2 && fine1 > inizio2);
};

// Endpoint per creare un nuovo appuntamento
app.post('/appuntamenti', authenticateToken, async (req, res) => {
  try {
    // Normalizza la data ricevuta
    const dataRichiesta = new Date(req.body.data);
    dataRichiesta.setHours(0, 0, 0, 0);

    // Ottieni l'operatore e verifica che offra il servizio richiesto
    const operator = await Operator.findById(req.body.operator).populate('services.service');
    if (!operator) {
      return res.status(404).json({ message: 'Operatore non trovato' });
    }

    const serviceInfo = operator.services.find(s => s.service._id.toString() === req.body.service);
    if (!serviceInfo) {
      return res.status(404).json({ message: 'Servizio non disponibile per questo operatore' });
    }

    // Trova tutti gli appuntamenti attivi per quell'operatore in quella data
    const appuntamentiDelGiorno = await Appuntamento.find({
      $and: [
        {
          $expr: {
            $eq: [
              { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              { $dateToString: { format: "%Y-%m-%d", date: dataRichiesta } }
            ]
          }
        },
        { operator: req.body.operator },
        { stato: 'attivo' }
      ]
    });

    // Verifica sovrapposizioni con altri appuntamenti
    const sovrapposizione = appuntamentiDelGiorno.some(app => {
      // Verifica la sovrapposizione considerando la durata del servizio
      return verificaSovrapposizione(
        req.body.orario,
        serviceInfo.duration,
        app.orario,
        app.duration
      );
    });

    if (sovrapposizione) {
      return res.status(400).json({ 
        message: 'Non è possibile prenotare in questo orario a causa di una sovrapposizione con un altro appuntamento.'
      });
    }

    // Crea il nuovo appuntamento
    console.log('Creazione nuovo appuntamento per utente:', req.user.id);
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const nuovoAppuntamento = new Appuntamento({
      date: req.body.data,
      nota: req.body.nota,
      nomeCliente: req.body.nomeCliente,
      email: req.user.email,
      orario: req.body.orario,
      userId: userId,
      operator: new mongoose.Types.ObjectId(req.body.operator),
      service: new mongoose.Types.ObjectId(req.body.service),
      duration: serviceInfo.duration,
      stato: 'attivo'
    });
    
    await nuovoAppuntamento.save();
    res.status(201).json({ message: 'Appuntamento salvato con successo' });
  } catch (error) {
    console.error('Errore nella creazione dell\'appuntamento:', error);
    res.status(500).json({ 
      message: 'Errore nella creazione dell\'appuntamento',
      error: error.message 
    });
  }
});

// Endpoint per cancellare un appuntamento
app.delete('/appuntamenti/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Richiesta di cancellazione appuntamento con ID:', req.params.id);
    
    const appuntamento = await Appuntamento.findById(req.params.id);
    console.log('Appuntamento trovato:', appuntamento);
    
    if (!appuntamento) {
      console.log('Appuntamento non trovato nel database');
      return res.status(404).json({ message: 'Appuntamento non trovato' });
    }

    // Verifica che l'utente sia il proprietario dell'appuntamento o un admin
    const user = await User.findById(req.user.id);
    if ((user.role === 'admin' && !user.subscription?.status === 'active') || 
        (user.role !== 'admin' && appuntamento.userId.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Non autorizzato a cancellare questo appuntamento' });
    }

    // Aggiorna lo stato dell'appuntamento a 'disdetto' invece di eliminarlo
    appuntamento.stato = 'disdetto';
    await appuntamento.save();
    res.json({ message: 'Appuntamento disdetto con successo' });
  } catch (error) {
    console.error('Errore nella cancellazione dell\'appuntamento:', error);
    res.status(500).json({ 
      message: 'Errore nella cancellazione dell\'appuntamento',
      error: error.message 
    });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
