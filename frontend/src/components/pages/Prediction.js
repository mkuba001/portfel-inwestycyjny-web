import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Prediction() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Formularz inwestycji
  const [initialInvestment, setInitialInvestment] = useState("10000");
  const [interestRate, setInterestRate] = useState("10");
  const [exchangeRate, setExchangeRate] = useState(""); // z predictedClose
  const [durationMonths, setDurationMonths] = useState("");
  const [walletName, setWalletName] = useState(null);

  useEffect(() => {
    // Odczyt z localStorage
    const baseCurrency = localStorage.getItem("baseCurrency");
    const alternativeCurrency = localStorage.getItem("alternativeCurrency");
    const startDate = localStorage.getItem("startDate");
    const endDate = localStorage.getItem("endDate");
    const predictedClose = localStorage.getItem("predictedClose");
    const investmentDuration = localStorage.getItem("investmentDurationMonths");
    const storedWalletName = localStorage.getItem("walletName");
    const storedFinalBudget = localStorage.getItem("finalBudget");

    if (!storedWalletName) {
      setError("No investment wallet selected.");
      return;
    }

    setWalletName(storedWalletName);
    setPrediction({
      base_currency: baseCurrency,
      alternative_currency: alternativeCurrency,
      start_date: startDate,
      prediction_date: endDate,
      predicted_close: predictedClose,
      investment_duration_months: investmentDuration,
    });

    if (predictedClose) {
      setExchangeRate(predictedClose);
    }
    if (investmentDuration) {
      setDurationMonths(investmentDuration);
    }
    if (storedFinalBudget) {
      setInitialInvestment(storedFinalBudget);
    } else {
      setInitialInvestment("10000"); // domyślna wartość
    }
  }, []);

  const handleCalculate = () => {
    if (!walletName) {
      setError("No investment wallet selected.");
      return;
    }
    if (!prediction || !prediction.start_date || !prediction.prediction_date) {
      setError("Prediction data is not loaded yet.");
      console.error("Prediction is missing:", prediction);
      return;
    }

    const payload = {
      wallet_name: walletName,
      budget: parseFloat(initialInvestment),
      interest_rate: parseFloat(interestRate),
      exchange_rate: parseFloat(exchangeRate),
      duration_months: parseInt(durationMonths),
      start_date: prediction.start_date,
      end_date: prediction.prediction_date,
    };

    console.log("Sending payload:", payload);

    fetch("http://localhost:5000/api/calculate-forex-wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.status === 404) {
          throw new Error("Portfolio not found (404). Maybe it was reset/dropped?");
        }
        if (!response.ok) {
          throw new Error("Failed to calculate investment goal.");
        }
        return response.json();
      })
      .then((data) => {
        // Zapisujemy finalBudget
        localStorage.setItem("finalBudget", data.final_value);

        console.log("Redirecting to results with data:", data);
        navigate("/results", { state: data });
      })
      .catch((error) => {
        console.error("❌ Error in handleCalculate:", error);
        setError(error.message);
      });
  };

  return (
    <div className="min-h-screen flex flex-col items-center text-white p-4">
      <h1 className="text-5xl font-bold mb-6">Prediction Page</h1>

      {error ? (
        <p className="text-lg text-red-500">{error}</p>
      ) : (
        <div className="flex w-full max-w-4xl gap-8">
          {/* Wyniki predykcji */}
          <div className="w-1/3 bg-gray-800 p-6 rounded-lg shadow-lg overflow-hidden">
            <h2 className="text-3xl font-bold mb-4">Prediction Results</h2>
            <div className="text-lg text-gray-300">
              {prediction ? (
                <>
                  <p><strong>Base Currency:</strong> {prediction.base_currency}</p>
                  <p><strong>Alternative Currency:</strong> {prediction.alternative_currency}</p>
                  <p><strong>Start Date:</strong> {prediction.start_date}</p>
                  <p><strong>Prediction Date:</strong> {prediction.prediction_date}</p>
                  <p><strong>Predicted Close:</strong> {prediction.predicted_close}</p>
                </>
              ) : (
                <p>Loading prediction data...</p>
              )}
            </div>
          </div>

          {/* Formularz inwestycji */}
          <div className="w-2/3 bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold mb-4">Investment Form</h2>

            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Initial Investment:</label>
              <input
                type="text"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded-lg"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Exchange Rate:</label>
              <input
                type="text"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded-lg"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Interest Rate (%):</label>
              <input
                type="text"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded-lg"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Duration (Months):</label>
              <input
                type="text"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded-lg"
              />
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={handleCalculate}
                className="bg-sky-500 hover:bg-sky-700 text-white font-bold py-2 px-6 rounded-full"
              >
                Calculate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
