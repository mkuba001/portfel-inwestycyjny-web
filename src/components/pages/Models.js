  import { useEffect, useState } from 'react';
  import { useNavigate } from 'react-router-dom';

  export default function Models() {
    const [selectedCurrency, setSelectedCurrency] = useState(null);  
    const [alternativeCurrencies, setAlternativeCurrencies] = useState([]);  
    const navigate = useNavigate();  

    useEffect(() => {
      const storedBaseCurrency = localStorage.getItem('selectedCurrency');
      const storedAlternativeCurrencies = JSON.parse(localStorage.getItem('alternativeCurrencies')) || [];

      if (!storedBaseCurrency || storedAlternativeCurrencies.length < 2) {
        // Jeśli waluta bazowa nie jest ustawiona lub jest mniej niż dwie waluty alternatywne, przekieruj do wyboru pary walutowej
        navigate('/forex-pair');
      } else {
        setSelectedCurrency(storedBaseCurrency);
        setAlternativeCurrencies(storedAlternativeCurrencies);
      }
    }, [navigate]);

    return (
      <div className="min-h-screen flex flex-col items-center text-white p-4">
        <h1 className="text-5xl font-bold mb-6">Forex Models</h1>

        {selectedCurrency ? (
          <p className="text-lg text-gray-300 mb-4">
            <span className="font-bold">Base Currency:</span> {selectedCurrency}
          </p>
        ) : (
          <p className="text-lg text-red-500 mb-4">Base Currency is not selected.</p>
        )}

        {alternativeCurrencies.length > 0 ? (
          <div className="text-lg text-gray-300 mb-4">
            <span className="font-bold">Alternative Currencies:</span>
            <ul className="list-disc list-inside ml-4">
              {alternativeCurrencies.map((currency, index) => (
                <li key={index}>{currency}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-lg text-red-500 mb-4">No alternative currencies selected.</p>
        )}

        <div className="mt-8">
          <h2 className="text-3xl font-bold mb-4">Choose how long would u like to invest</h2>
          {/* Tutaj można dodać dodatkową logikę lub informacje o modelach treningowych */}
        </div>

        <button
          className="mt-6 bg-gray-500 hover:bg-gray-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
          onClick={() => navigate('/forex-pair')}
        >
          Back to Currency Selection
        </button>
      </div>
    );
  }
