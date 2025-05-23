import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForexPair() {
  const navigate = useNavigate();
  const [baseCurrency, setBaseCurrency] = useState(null);
  const [alternativeCurrency, setAlternativeCurrency] = useState(null);
  const [step, setStep] = useState(1);

  const currencies = [
    { id: 'PLN', name: 'Polski złoty', flag: 'https://upload.wikimedia.org/wikipedia/en/1/12/Flag_of_Poland.svg' },
    { id: 'EUR', name: 'Euro', flag: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg' },
    { id: 'USD', name: 'Dolar amerykański', flag: 'https://upload.wikimedia.org/wikipedia/en/a/a4/Flag_of_the_United_States.svg' },
    { id: 'GBP', name: 'Funt brytyjski', flag: 'https://upload.wikimedia.org/wikipedia/en/a/ae/Flag_of_the_United_Kingdom.svg' },
  ];

  const handleCurrencyClick = (currencyId) => {
    if (step === 1) {
      setBaseCurrency(currencyId);
    } else {
      if (currencyId === baseCurrency) {
        alert("You can't choose the same currency twice!");
      } else {
        setAlternativeCurrency(currencyId);
      }
    }
  };

  const handleNextClick = () => {
    if (step === 1) {
      setStep(2);
    } else {
      localStorage.setItem('baseCurrency', baseCurrency);
      localStorage.setItem('alternativeCurrency', alternativeCurrency);
      localStorage.removeItem('walletName');

      navigate('/models');
    }
  };

  const handleBackClick = () => {
    setStep(1);
  };

  return (
    <div className="min-h-screen flex flex-col items-center text-white p-4">
      <h1 className="text-5xl font-bold mb-6">Forex Pairs Overview</h1>

      {step === 1 ? (
        <p className="text-lg text-gray-300 text-center max-w-2xl">
          Choose your base currency
          {baseCurrency && <span> (Chosen: {baseCurrency})</span>}
        </p>
      ) : (
        <p className="text-lg text-gray-300 text-center max-w-2xl">
          Choose your alternative currency
          {alternativeCurrency && <span> (Chosen: {alternativeCurrency})</span>}
        </p>
      )}

      <div className="m-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center">
          {currencies.map((currency) => (
            <div
              key={currency.id}
              className={`relative flex flex-col items-center cursor-pointer transition-transform transform hover:scale-105 ${
                (step === 1 && baseCurrency === currency.id) ||
                (step === 2 && alternativeCurrency === currency.id)
                  ? 'bg-indigo-500'
                  : 'bg-gray-700'
              } w-40 h-48 p-4 rounded-lg`}
              onClick={() => handleCurrencyClick(currency.id)}
            >
              <div className="w-24 h-24 flex items-center justify-center">
                <img src={currency.flag} alt={currency.name} className="w-16 h-16 rounded-full" />
              </div>
              <p className="text-lg mt-4 text-center">{currency.name} ({currency.id})</p>

              {((step === 1 && baseCurrency === currency.id) ||
                (step === 2 && alternativeCurrency === currency.id)) && (
                <div className="absolute top-0 right-0 bg-green-500 w-6 h-6 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-4">
        {step === 2 && (
          <button
            onClick={handleBackClick}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
          >
            Wróć
          </button>
        )}
        <button
          onClick={handleNextClick}
          className={`${
            (step === 1 && !baseCurrency) || (step === 2 && !alternativeCurrency)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-sky-500 hover:bg-sky-700'
          } text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform hover:scale-105 transition-transform duration-300`}
          disabled={
            (step === 1 && !baseCurrency) || (step === 2 && !alternativeCurrency)
          }
        >
          Dalej
        </button>
      </div>
    </div>
  );
}
