import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Importy ChartJS i react-chartjs-2 (opcjonalnie – wykres)
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Rejestrujemy komponenty ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Prediction() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  // Dane predykcji odczytane z localStorage
  const [prediction, setPrediction] = useState(null);

  // Pola formularza – domyślne wartości (mogą być nadpisane danymi z localStorage)
  const [normalInitialInvestment, setNormalInitialInvestment] = useState("10000");
  const [reverseInitialInvestment, setReverseInitialInvestment] = useState("8000");
  const [interestRate, setInterestRate] = useState("10");
  const [reverseInterestRate, setReverseInterestRate] = useState("8");
  const [normalExchangeRate, setNormalExchangeRate] = useState("4.0");
  const [reverseExchangeRate, setReverseExchangeRate] = useState("3.0");
  const [durationMonths, setDurationMonths] = useState("6");
  const [bothSides, setBothSides] = useState(false);
  const [walletName, setWalletName] = useState(null);

  // Nowe pola dla symulacji lokaty
  const [depositBudget, setDepositBudget] = useState("10000");
  const [depositAnnualRate, setDepositAnnualRate] = useState("4.0");

  // Finalne wartości modeli i dodatkowe dane predykcji (np. do wykresu)
  const [finalXgb, setFinalXgb] = useState(null);
  const [finalRf, setFinalRf] = useState(null);
  const [finalLstm, setFinalLstm] = useState(null);
  const [finalArima, setFinalArima] = useState(null);
  const [predictionsData, setPredictionsData] = useState(null);

  // Final budżety dla normalnej i odwrotnej inwestycji
  const [finalBudgetNormal, setFinalBudgetNormal] = useState(null);
  const [finalBudgetReverse, setFinalBudgetReverse] = useState(null);

  // Helper: łączenie danych z poszczególnych modeli do wykresu (ChartJS)
  const getCombinedChartData = () => {
    if (
      predictionsData &&
      predictionsData.predictions_xgboost &&
      predictionsData.predictions_rf &&
      predictionsData.predictions_lstm &&
      predictionsData.predictions_arima
    ) {
      const len = predictionsData.predictions_xgboost.length;
      let combined = [];
      for (let i = 0; i < len; i++) {
        combined.push({
          Date: predictionsData.predictions_xgboost[i].Date,
          XGBoost: predictionsData.predictions_xgboost[i].Predicted,
          RF: predictionsData.predictions_rf[i]?.Predicted,
          LSTM: predictionsData.predictions_lstm[i]?.Predicted,
          ARIMA: predictionsData.predictions_arima[i]?.Predicted,
        });
      }
      return combined;
    }
    return [];
  };

  const combinedChartData = getCombinedChartData();

  const chartData = {
    labels: combinedChartData.map((item) => item.Date),
    datasets: [
      {
        label: "XGBoost",
        data: combinedChartData.map((item) => item.XGBoost),
        borderColor: "#8884d8",
        backgroundColor: "rgba(136, 132, 216, 0.5)",
      },
      {
        label: "RF",
        data: combinedChartData.map((item) => item.RF),
        borderColor: "#82ca9d",
        backgroundColor: "rgba(130, 202, 157, 0.5)",
      },
      {
        label: "LSTM",
        data: combinedChartData.map((item) => item.LSTM),
        borderColor: "#ffc658",
        backgroundColor: "rgba(255, 198, 88, 0.5)",
      },
      {
        label: "ARIMA",
        data: combinedChartData.map((item) => item.ARIMA),
        borderColor: "#ff7300",
        backgroundColor: "rgba(255, 115, 0, 0.5)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Model Predictions Over Time" },
    },
  };

  useEffect(() => {
    // Odczyt danych z localStorage
    const baseCurrency = localStorage.getItem("baseCurrency");
    const alternativeCurrency = localStorage.getItem("alternativeCurrency");
    const startDate = localStorage.getItem("startDate");
    const endDate = localStorage.getItem("endDate");
    const predictedClose = localStorage.getItem("predictedClose");
    const investmentDuration = localStorage.getItem("investmentDurationMonths");
    const storedWalletName = localStorage.getItem("walletName");

    // Odczyt finalnych prognoz modeli
    const xgb = localStorage.getItem("finalXgb");
    const rf = localStorage.getItem("finalRf");
    const lstm = localStorage.getItem("finalLstm");
    const arima = localStorage.getItem("finalArima");

    // Odczyt pełnego obiektu predykcji (JSON)
    const predsStr = localStorage.getItem("predictions");
    let predsObj = null;
    if (predsStr) {
      try {
        predsObj = JSON.parse(predsStr);
      } catch (err) {
        console.error("Error parsing predictions JSON:", err);
      }
    }

    // Odczyt final budżetów – klucze "lastFinalBudgetNormal", "lastFinalBudgetReverse"
    // oraz wynik lokaty "lastDepositResult"
    const storedFinalBudgetNormal = localStorage.getItem("lastFinalBudgetNormal");
    const storedFinalBudgetReverse = localStorage.getItem("lastFinalBudgetReverse");
    const storedDepositResult = localStorage.getItem("lastDepositResult");

    if (!storedWalletName) {
      setError("No investment wallet selected.");
      return;
    }
    setWalletName(storedWalletName);

    const tmpPrediction = {
      base_currency: baseCurrency,
      alternative_currency: alternativeCurrency,
      start_date: startDate,
      prediction_date: endDate,
      predicted_close: predictedClose,
      investment_duration_months: investmentDuration,
    };
    setPrediction(tmpPrediction);

    setFinalXgb(xgb || null);
    setFinalRf(rf || null);
    setFinalLstm(lstm || null);
    setFinalArima(arima || null);
    setPredictionsData(predsObj || null);

    setFinalBudgetNormal(storedFinalBudgetNormal || null);
    setFinalBudgetReverse(storedFinalBudgetReverse || null);

    // Ustawiamy wartości pól formularza, jeśli są zapisane w localStorage
    if (storedFinalBudgetNormal) {
      setNormalInitialInvestment(storedFinalBudgetNormal);
    }
    if (storedFinalBudgetReverse) {
      setReverseInitialInvestment(storedFinalBudgetReverse);
    }
    if (storedDepositResult) {
      setDepositBudget(storedDepositResult);
    }
  }, []);

  const handleCalculate = () => {
    if (!walletName) {
      setError("No investment wallet selected.");
      return;
    }
    if (!prediction || !prediction.start_date || !prediction.prediction_date) {
      setError("Prediction data is not loaded yet (start_date/end_date).");
      return;
    }

    const payload = {
      wallet_name: walletName,
      normal_budget: parseFloat(normalInitialInvestment),
      reverse_budget: parseFloat(reverseInitialInvestment),
      interest_rate: parseFloat(interestRate),
      reverse_interest_rate: parseFloat(reverseInterestRate),
      normal_exchange_rate: parseFloat(normalExchangeRate),
      reverse_exchange_rate: parseFloat(reverseExchangeRate),
      start_date: prediction.start_date,
      end_date: prediction.prediction_date,
      duration_months: parseInt(durationMonths, 10),
      both_sides: bothSides,
      deposit_budget: parseFloat(depositBudget),
      deposit_annual_rate: parseFloat(depositAnnualRate),
    };

    console.log("Sending payload to /api/calculate-forex-wallet:", payload);

    fetch("http://localhost:5000/api/calculate-forex-wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((resp) => {
        if (!resp.ok) {
          throw new Error("Failed to calculate investment goal.");
        }
        return resp.json();
      })
      .then((data) => {
        console.log("Server response (calculate-forex-wallet):", data);
        // Zapisujemy finalne budżety – analogicznie jak dla forex
        if (data.final_xgb !== undefined) {
          localStorage.setItem("lastFinalBudgetNormal", data.final_xgb);
          setFinalBudgetNormal(data.final_xgb);
        }
        if (data.final_lstm !== undefined) {
          localStorage.setItem("lastFinalBudgetReverse", data.final_lstm);
          setFinalBudgetReverse(data.final_lstm);
        }
        if (data.predicted_close !== undefined) {
          localStorage.setItem("predictedClose", data.predicted_close);
        }
        if (data.investment_duration_months !== undefined) {
          localStorage.setItem("investmentDurationMonths", data.investment_duration_months);
        }
        if (data.predictions) {
          localStorage.setItem("predictions", JSON.stringify(data.predictions));
        }
        // Zapisujemy również wynik symulacji lokaty
        if (data.deposit_result && data.deposit_result.final_deposit_value !== undefined) {
          localStorage.setItem("lastDepositResult", data.deposit_result.final_deposit_value);
        }
        navigate("/results", { state: data });
      })
      .catch((err) => {
        console.error("Error in handleCalculate:", err);
        setError(err.message);
      });
  };

  return (
    <div className="min-h-screen flex flex-col items-center text-white p-4">
      <h1 className="text-5xl font-bold mb-6">Prediction Page</h1>

      {error && <p className="text-lg text-red-500">{error}</p>}

      <div className="flex w-full max-w-4xl gap-8">
        {/* LEFT - Informacje o predykcji i finalne wyniki */}
        <div className="w-1/3 bg-gray-800 p-6 rounded-lg shadow-lg overflow-hidden">
          <h2 className="text-3xl font-bold mb-4">Prediction Results</h2>
          <div className="text-lg text-gray-300">
            {prediction ? (
              <>
                <p>
                  <strong>Base Currency:</strong> {prediction.base_currency}
                </p>
                <p>
                  <strong>Alternative Currency:</strong> {prediction.alternative_currency}
                </p>
                <p>
                  <strong>Start Date:</strong> {prediction.start_date}
                </p>
                <p>
                  <strong>Prediction Date:</strong> {prediction.prediction_date}
                </p>
                <p>
                  <strong>Investment Duration (months):</strong> {prediction.investment_duration_months}
                </p>
                <hr className="my-2" />
                <p>
                  <strong>Final XGB:</strong> {finalXgb || "-"}
                </p>
                <p>
                  <strong>Final RF:</strong> {finalRf || "-"}
                </p>
                <p>
                  <strong>Final LSTM:</strong> {finalLstm || "-"}
                </p>
                <p>
                  <strong>Final ARIMA:</strong> {finalArima || "-"}
                </p>
                <hr className="my-2" />
                <p>
                  <strong>Final Budget Normal:</strong> {finalBudgetNormal || "-"}
                </p>
                <p>
                  <strong>Final Budget Reverse:</strong> {finalBudgetReverse || "-"}
                </p>
              </>
            ) : (
              <p>Loading prediction data...</p>
            )}
          </div>
        </div>

        {/* RIGHT - Investment Form */}
        <div className="w-2/3 bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold mb-4">Investment Form</h2>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Normal Initial Investment:</label>
            <input
              type="text"
              value={normalInitialInvestment}
              onChange={(e) => setNormalInitialInvestment(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Reverse Initial Investment:</label>
            <input
              type="text"
              value={reverseInitialInvestment}
              onChange={(e) => setReverseInitialInvestment(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Interest Rate (Normal) %:</label>
            <input
              type="text"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Interest Rate (Reverse) %:</label>
            <input
              type="text"
              value={reverseInterestRate}
              onChange={(e) => setReverseInterestRate(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Normal Exchange Rate:</label>
            <input
              type="text"
              value={normalExchangeRate}
              onChange={(e) => setNormalExchangeRate(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Reverse Exchange Rate:</label>
            <input
              type="text"
              value={reverseExchangeRate}
              onChange={(e) => setReverseExchangeRate(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded-lg"
            />
          </div>
          {/* Pola dla symulacji lokaty */}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Deposit Budget:</label>
            <input
              type="text"
              value={depositBudget}
              onChange={(e) => setDepositBudget(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Deposit Annual Rate (%):</label>
            <input
              type="text"
              value={depositAnnualRate}
              onChange={(e) => setDepositAnnualRate(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded-lg"
            />
          </div>
          <div className="flex items-center mb-4">
            <input
              id="bothSidesCheck"
              type="checkbox"
              checked={bothSides}
              onChange={(e) => setBothSides(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="bothSidesCheck" className="text-gray-300">
              Calculate Reverse Scenario?
            </label>
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

      {/* Chart Section (opcjonalnie) */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-4xl mt-8">
        <h2 className="text-3xl font-bold mb-4">Prediction Chart</h2>
        {combinedChartData && combinedChartData.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <p>Loading chart data...</p>
        )}
      </div>
    </div>
  );
}
