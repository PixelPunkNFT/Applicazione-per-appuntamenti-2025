import React from 'react';
import '../Styles/PrivacyPolicy.css';

export default function PrivacyPolicy() {
  return (
    <div className="privacy-container">
      <h1 className="privacy-title">Informativa sulla Privacy e sui Cookie</h1>
      
      <section className="privacy-section">
        <h2 className="section-title">Informazioni generali</h2>
        <p className="privacy-text">
          La presente informativa descrive come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali quando utilizzi il nostro sito web.
        </p>
      </section>

      <section className="privacy-section">
        <h2 className="section-title">Cookie utilizzati</h2>
        
        <div className="subsection">
          <h3 className="subsection-title">Cookie tecnici (necessari)</h3>
          <p className="privacy-text">
            Questi cookie sono necessari per il funzionamento del sito. Senza questi cookie, il sito non funzionerebbe correttamente.
            Includono cookie che permettono di salvare la sessione dell'utente e di effettuare altre attività strettamente necessarie
            per il funzionamento del sito.
          </p>
        </div>

        <div className="subsection">
          <h3 className="subsection-title">Cookie analitici</h3>
          <p className="privacy-text">
            Questi cookie ci permettono di contare le visite e le fonti di traffico per poter misurare e migliorare le prestazioni
            del nostro sito. Ci aiutano a sapere quali pagine sono le più e le meno popolari e vedere come i visitatori si muovono
            nel sito.
          </p>
        </div>

        <div className="subsection">
          <h3 className="subsection-title">Cookie di marketing</h3>
          <p className="privacy-text">
            Questi cookie vengono utilizzati per tracciare i visitatori attraverso i siti web. L'intenzione è quella di visualizzare
            annunci pertinenti e coinvolgenti per il singolo utente e quindi più preziosi per gli editori e gli inserzionisti terzi.
          </p>
        </div>
      </section>

      <section className="privacy-section">
        <h2 className="section-title">Come gestire i cookie</h2>
        <p className="privacy-text">
          Puoi modificare le tue preferenze sui cookie in qualsiasi momento utilizzando il banner dei cookie presente sul sito.
          Inoltre, la maggior parte dei browser ti permette di rifiutare l'installazione dei cookie e di eliminare i cookie già presenti.
        </p>
      </section>

      <section className="privacy-section">
        <h2 className="section-title">I tuoi diritti</h2>
        <p className="privacy-text">
          Hai il diritto di accedere, rettificare o cancellare i tuoi dati personali. Puoi anche limitare od opporti al trattamento
          dei tuoi dati e richiedere la portabilità dei dati.
        </p>
      </section>

      <section className="privacy-section">
        <h2 className="section-title">Contattaci</h2>
        <p className="privacy-text">
          Per qualsiasi domanda riguardante questa informativa sulla privacy o il trattamento dei tuoi dati personali,
          non esitare a contattarci.
        </p>
      </section>
    </div>
  );
}
