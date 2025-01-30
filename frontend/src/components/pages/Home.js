import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  
  const [showExistingWallets, setShowExistingWallets] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [error, setError] = useState(null);

  /**
   * Funkcja wywoływana po kliknięciu "Start NEW Investment".
   * 1. Ustawia forceNew = "true" w localStorage,
   * 2. Przenosi do ekranu wyboru par walutowych (/forex-pair).
   */
  const handleStartNew = () => {
    // KLUCZOWA POPRAWKA:
    localStorage.setItem("forceNew", "true");
    navigate('/forex-pair');
  };

  /**
   * Funkcja pobiera listę portfeli z backendu i otwiera listę do wyboru.
   */
  const handleShowExistingWallets = async () => {
    if (showExistingWallets && wallets.length > 0) {
      setShowExistingWallets(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/get_wallets');
      if (!response.ok) {
        throw new Error('Failed to fetch wallets from backend');
      }
      const data = await response.json();
      if (data.wallets) {
        setWallets(data.wallets);
        setShowExistingWallets(true);
      } else {
        setError('No wallets array in response');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Funkcja wywoływana po wybraniu portfela z listy.
   */
  const handleSelectWallet = (walletName) => {
    const parts = walletName.split('_'); 
    if (parts.length < 3) {
      setError("Invalid wallet name format");
      return;
    }

    const baseCurrency = parts[0];
    const alternativeCurrency = parts[1];

    localStorage.setItem('walletName', walletName);
    localStorage.setItem('baseCurrency', baseCurrency);
    localStorage.setItem('alternativeCurrency', alternativeCurrency);

    // Tu nie ustawiamy forceNew = "true", bo wczytujemy ISTNIEJĄCY portfel.
    // Od razu przechodzimy do /results
    navigate('/results');
  };

  return (
    <main className="flex flex-col items-center justify-center container mx-auto p-4 mt-10 sm:mt-16 md:mt-20 lg:mt-24">
      <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 text-center max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mb-6 sm:mb-8">
        Welcome to the Forex Pairs page. Here, you can explore different currency pairs and analyze their trends using advanced AI-powered tools.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Przycisk: Start Now (czyli NOWA inwestycja) */}
        <button
          onClick={handleStartNew}
          className="bg-sky-500 hover:bg-sky-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-base sm:text-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
        >
          Start NEW Investment
        </button>

        {/* Przycisk: Load Existing Wallet */}
        <button
          onClick={handleShowExistingWallets}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-base sm:text-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
        >
          {showExistingWallets ? 'Hide Existing Wallets' : 'Load Existing Wallets'}
        </button>
      </div>

      {error && (
        <p className="text-red-500 mt-4">
          {error}
        </p>
      )}

      {/* Lista istniejących portfeli */}
      {showExistingWallets && wallets.length > 0 && (
        <div className="mt-8 w-full max-w-md bg-gray-800 p-4 rounded-lg shadow-lg">
          <h2 className="text-xl text-white font-bold mb-4">Select a Wallet:</h2>
          <ul className="space-y-2">
            {wallets.map((wallet) => (
              <li key={wallet}>
                <button
                  onClick={() => handleSelectWallet(wallet)}
                  className="w-full text-left bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition"
                >
                  {wallet}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
