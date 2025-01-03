import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Styles/ServicesManagement.css';

const ServicesManagement = () => {
    const [services, setServices] = useState([]);
    const [newService, setNewService] = useState({
        name: '',
        duration: '',
        description: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        try {
            const response = await axios.get('http://localhost:5000/services', config);
            setServices(response.data);
        } catch (err) {
            setError('Errore nel caricamento dei servizi');
            setTimeout(() => setError(''), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewService(prev => ({
            ...prev,
            [name]: name === 'duration' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };
        try {
            await axios.post('http://localhost:5000/services', newService, config);
            setSuccess('Servizio aggiunto con successo');
            setNewService({ name: '', duration: '', description: '' });
            await fetchServices();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Errore nella creazione del servizio');
            setTimeout(() => setError(''), 3000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (serviceId) => {
        setDeletingId(serviceId);
        const token = localStorage.getItem('token');
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };
        try {
            await axios.delete(`http://localhost:5000/services/${serviceId}`, config);
            setSuccess('Servizio eliminato con successo');
            await fetchServices();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Errore nell\'eliminazione del servizio');
            setTimeout(() => setError(''), 3000);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="services-management">
            <h2>Gestione Servizi</h2>
            
            <form onSubmit={handleSubmit} className={`service-form ${isSubmitting ? 'loading' : ''}`}>
                <div className="form-group">
                    <label>Nome del Servizio:</label>
                    <input
                        type="text"
                        name="name"
                        value={newService.name}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label>Durata (minuti):</label>
                    <input
                        type="number"
                        name="duration"
                        value={newService.duration}
                        onChange={handleInputChange}
                        required
                        min="1"
                    />
                </div>
                
                <div className="form-group">
                    <label>Descrizione:</label>
                    <textarea
                        name="description"
                        value={newService.description}
                        onChange={handleInputChange}
                    />
                </div>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Aggiunta in corso...' : 'Aggiungi Servizio'}
                </button>
            </form>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className={`services-list ${isLoading ? 'loading' : ''}`}>
                <h3>Servizi Disponibili</h3>
                {!isLoading && services.map(service => (
                    <div key={service._id} className="service-item">
                        <div className="service-info">
                            <h4>{service.name}</h4>
                            <p>Durata: {service.duration} minuti</p>
                            {service.description && <p>Descrizione: {service.description}</p>}
                        </div>
                        <button 
                            onClick={() => handleDelete(service._id)}
                            className={`delete-button ${deletingId === service._id ? 'loading' : ''}`}
                            disabled={deletingId === service._id}
                        >
                            {deletingId === service._id ? 'Eliminazione...' : 'Elimina'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServicesManagement;
