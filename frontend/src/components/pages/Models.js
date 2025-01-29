import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Models() {
  const [baseCurrency, setBaseCurrency] = useState(null);
  const [alternativeCurrency, setAlternativeCurrency] = useState(null);
  const [startDate, setStartDate] = useState("2024-01-11");
  const [endDate, setEndDate] = useState("2024-01-18");
  const [predictionData, setPredictionData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedBaseCurrency = localStorage.getItem("baseCurrency");
    const storedAlternativeCurrency = localStorage.getItem("alternativeCurrency");

    if (!storedBaseCurrency || !storedAlternativeCurrency) {
      navigate("/forex-pair");
    } else {
      setBaseCurrency(storedBaseCurrency);
      setAlternativeCurrency(storedAlternativeCurrency);
    }
  }, [navigate]);

  // Aktualizacja endDate na podstawie startDate
  const handleStartDateChange = (newStartDate) => {
    setStartDate(newStartDate);
    const startDateObj = new Date(newStartDate);
    const newEndDateObj = new Date(startDateObj);
    newEndDateObj.setDate(startDateObj.getDate() + 7);
    setEndDate(newEndDateObj.toISOString().split("T")[0]);
  };

  // Tworzenie nowego portfela, jeśli nie istnieje lub po resecie
  const ensureWalletExists = async () => {
    let walletName = localStorage.getItem("walletName");

    if (!walletName) {
      const requestData = {
        base_currency: baseCurrency,
        alternative_currency: alternativeCurrency,
      };

      try {
        const response = await fetch("http://localhost:5000/api/start_new_wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          throw new Error("Failed to create a new wallet.");
        }

        const data = await response.json();
        localStorage.setItem("walletName", data.wallet_name);
        return data.wallet_name;
      } catch (error) {
        console.error("Error creating wallet:", error);
        setError(error.message);
        return null;
      }
    }

    return walletName;
  };

  // Wykonanie predykcji
  const handlePrediction = async () => {
    const walletName = await ensureWalletExists();
    if (!walletName) return;

    const requestData = {
      base_currency: baseCurrency,
      alternative_currency: alternativeCurrency,
      start_date: startDate,
      prediction_date: endDate,
    };

    console.log("🔹 Sending prediction request:", requestData);

    fetch("http://localhost:5000/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch prediction data.");
        }
        return response.json();
      })
      .then((data) => {
        console.log("🔹 Prediction response:", data);
        setPredictionData(data);

        // ✅ Zapisujemy dane do localStorage
        localStorage.setItem("startDate", startDate);
        localStorage.setItem("endDate", endDate);
        localStorage.setItem("predictedClose", data.predicted_close);
        localStorage.setItem("investmentDurationMonths", data.investment_duration_months);

        navigate("/prediction");
      })
      .catch((error) => {
        console.error("❌ Error fetching prediction data:", error);
        setError(error.message);
      });
  };

  return (
    <div className="min-h-screen flex flex-col items-center text-white p-4">
      <h1 className="text-5xl font-bold mb-6">Forex Models</h1>

      {baseCurrency && (
        <p className="text-lg text-gray-300 mb-4">
          <span className="font-bold">Base Currency:</span> {baseCurrency}
        </p>
      )}

      {alternativeCurrency && (
        <p className="text-lg text-gray-300 mb-4">
          <span className="font-bold">Alternative Currency:</span> {alternativeCurrency}
        </p>
      )}

      <div className="mt-8">
        <h2 className="text-3xl font-bold mb-4">Choose Investment Period</h2>

        <div className="flex flex-col items-center">
          <label className="text-lg text-gray-300 mb-2">Start Date:</label>
          <input
            type="date"
            value={startDate}
            min="2010-01-01"
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="text-center bg-gray-700 text-white p-3 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 transition duration-200 ease-in-out mb-4"
          />

          <label className="text-lg text-gray-300 mb-2">End Date:</label>
          <input
            type="date"
            value={endDate}
            min={startDate || "2010-01-08"}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-center bg-gray-700 text-white p-3 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 transition duration-200 ease-in-out"
          />
        </div>
      </div>

      <div className="flex space-x-4 mt-6">
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
          onClick={() => navigate("/forex-pair")}
        >
          Back to Currency Selection
        </button>

        <button
          className="bg-sky-500 hover:bg-sky-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
          onClick={handlePrediction}
        >
          Predict
        </button>
      </div>

      {error && <p className="text-lg text-red-500 mt-4">{error}</p>}

      {predictionData && (
        <div className="bg-gray-700 p-4 rounded-lg mt-4 text-white">
          <h3 className="text-xl font-bold">Prediction Data:</h3>
          <p><strong>Predicted Close:</strong> {predictionData.predicted_close}</p>
          <p><strong>Investment Duration (Months):</strong> {predictionData.investment_duration_months}</p>
        </div>
      )}
    </div>
  );
}
