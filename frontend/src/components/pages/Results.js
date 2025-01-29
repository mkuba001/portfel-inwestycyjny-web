import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Charts from "./Charts"; // Import wykresów

export default function Results() {
  const [investments, setInvestments] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("results"); // 🔹 Przełącznik między zakładkami
  const navigate = useNavigate();

  // Pobierz nazwę portfela z localStorage
  const walletName = localStorage.getItem("walletName");
  const baseCurrency = localStorage.getItem("baseCurrency") || "USD"; // Domyślna waluta bazowa

  useEffect(() => {
    if (!walletName) {
      setError("No investment wallet selected.");
      return;
    }

    fetch(`http://localhost:5000/api/get_wallet_data/${walletName}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch the investment data.");
        }
        return response.json();
      })
      .then((data) => {
        if (data.investments && data.investments.length > 0) {
          setInvestments(data.investments);

          // ✅ Pobranie ostatniej wartości `final_budget` i zapisanie do Local Storage
          const lastInvestment = data.investments[data.investments.length - 1];
          localStorage.setItem("lastFinalBudget", lastInvestment.final_budget);
        } else {
          setError("No investments found in this wallet.");
        }
      })
      .catch((error) => {
        setError(error.message);
      });
  }, [walletName]);

  // ✅ Przenosi do wyboru dat (Models.js)
  const handleContinueInvestment = () => {
    navigate("/models");
  };

  // ✅ Wyczyść localStorage i wróć do home
  const handleReset = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-1/5 bg-gray-900 p-6 min-h-screen flex flex-col space-y-6">
        <button
          className={`py-3 px-6 rounded-lg text-lg font-bold transition ${
            activeTab === "results" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setActiveTab("results")}
        >
          📊 Results
        </button>
        <button
          className={`py-3 px-6 rounded-lg text-lg font-bold transition ${
            activeTab === "charts" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setActiveTab("charts")}
        >
          📈 Charts
        </button>
        <button
          className="mt-auto py-3 px-6 bg-red-500 text-white font-bold rounded-lg"
          onClick={handleReset}
        >
          🔄 Reset Portfolio
        </button>
      </div>

      {/* Główna zawartość */}
      <div className="w-4/5 p-6 text-white">
        {activeTab === "results" ? (
          <>
            <h1 className="text-5xl font-bold mb-6">Investment Goal Results</h1>

            {error ? (
              <p className="text-lg text-red-500">{error}</p>
            ) : (
              <>
                <div className="w-full max-w-4xl bg-gray-800 p-6 rounded-lg shadow-lg">
                  <h2 className="text-3xl font-bold mb-4">Investment Wallet: {walletName}</h2>

                  {investments.length > 0 ? (
                    <div className="space-y-6">
                      {investments.map((investment, index) => {
                        // 🟢 Określanie waluty startowej
                        let startCurrency = baseCurrency;
                        if (index > 0) {
                          startCurrency = investments[index - 1].currency_conversion ? "PLN" : baseCurrency;
                        }

                        // 🟢 Określanie waluty końcowej
                        const finalCurrency = investment.currency_conversion ? "PLN" : startCurrency;

                        return (
                          <div key={index} className="border-b border-gray-600 pb-4">
                            <h3 className="text-xl font-bold text-sky-400 mb-2">
                              Investment {index + 1}
                            </h3>
                            <p><strong>Start Budget:</strong> {investment.start_budget} {startCurrency}</p>
                            <p><strong>Final Budget:</strong> {investment.final_budget} {finalCurrency}</p>
                            <p><strong>Start Time:</strong> {investment.start_time}</p>
                            <p><strong>End Time:</strong> {investment.end_time}</p>
                            <p><strong>Currency Conversion:</strong> {investment.currency_conversion ? "Yes" : "No"}</p>
                            <p><strong>Scenario:</strong> {investment.scenario}</p>
                            <p><strong>Timestamp:</strong> {investment.timestamp}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-lg text-gray-300">Loading investment data...</p>
                  )}
                </div>

                {/* 🔹 Przenosi do wyboru dat w Models.js */}
                <button
                  className="mt-6 bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full"
                  onClick={handleContinueInvestment}
                >
                  Continue Investment
                </button>
              </>
            )}
          </>
        ) : (
          <Charts walletName={walletName} /> // 🔹 Przechodzimy do Charts.js
        )}
      </div>
    </div>
  );
}
