import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Models() {
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [alternativeCurrencies, setAlternativeCurrencies] = useState([]);
  const [startDate, setStartDate] = useState('2024-01-11');
  const [endDate, setEndDate] = useState('2024-01-18');     
  const navigate = useNavigate();

  useEffect(() => {
    const storedBaseCurrency = localStorage.getItem('selectedCurrency');
    const storedAlternativeCurrencies = JSON.parse(localStorage.getItem('alternativeCurrencies')) || [];

    if (!storedBaseCurrency || storedAlternativeCurrencies.length < 2) {
      navigate('/forex-pair');
    } else {
      setSelectedCurrency(storedBaseCurrency);
      setAlternativeCurrencies(storedAlternativeCurrencies);
    }
  }, [navigate]);

  // Funkcja do aktualizacji endDate na 7 dni po startDate
  const handleStartDateChange = (newStartDate) => {
    setStartDate(newStartDate);

    const startDateObj = new Date(newStartDate);
    const newEndDateObj = new Date(startDateObj);
    newEndDateObj.setDate(startDateObj.getDate() + 7);

    
    const formattedEndDate = newEndDateObj.toISOString().split('T')[0];
    setEndDate(formattedEndDate);
  };

  const handlePredict = () => {
    console.log("Prediction requested");
    console.log(startDate)
    console.log(endDate)
  };

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
        <h2 className="text-3xl font-bold mb-4">Choose Investment Period</h2>

        {/* Wybór daty początkowej i końcowej */}
        <div className="flex flex-col items-center">
          <label className="text-lg text-gray-300 mb-2">Start Date:</label>
          <input
            type="date"
            value={startDate}
            min="2024-01-11" // Minimalna data startowa
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="text-center bg-gray-700 text-white p-3 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 transition duration-200 ease-in-out mb-4"
          />

          <label className="text-lg text-gray-300 mb-2">End Date:</label>
          <input
            type="date"
            value={endDate}
            min={startDate || "2024-01-18"} // Minimalna data końcowa zależy od startDate
            onChange={(e) => setEndDate(e.target.value)}
            className="text-center bg-gray-700 text-white p-3 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 transition duration-200 ease-in-out"
          />
        </div>
      </div>

      <div className="flex space-x-4 mt-6">
        {/* Przycisk powrotu do wyboru walut */}
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
          onClick={() => navigate('/forex-pair')}
        >
          Back to Currency Selection
        </button>

        {/* Nowy przycisk Predict */}
        <button
          className="bg-sky-500 hover:bg-sky-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
          onClick={handlePredict}
        >
          Predict
        </button>
      </div>
    </div>
  );
}
