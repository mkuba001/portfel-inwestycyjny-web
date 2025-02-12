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

  // Po załadowaniu komponentu, wczytujemy waluty z localStorage
  useEffect(() => {
    const storedBase = localStorage.getItem("baseCurrency");
    const storedAlt = localStorage.getItem("alternativeCurrency");

    if (!storedBase || !storedAlt) {
      console.log("⚠️ Brak walut w localStorage! Przekierowanie na /forex-pair");
      navigate("/forex-pair");
    } else {
      setBaseCurrency(storedBase);
      setAlternativeCurrency(storedAlt);
    }
  }, [navigate]);

  // Po ustawieniu walut, zapewniamy istnienie (lub tworzymy) portfel
  useEffect(() => {
    if (baseCurrency && alternativeCurrency) {
      ensureWalletExists();
    }
    // eslint-disable-next-line
  }, [baseCurrency, alternativeCurrency]);

  // === FUNKCJA do tworzenia / sprawdzenia portfela ===
  const ensureWalletExists = async () => {
    let walletName = localStorage.getItem("walletName");

    // Sprawdzamy, czy forceNew jest "true"
    const forceNew = localStorage.getItem("forceNew") === "true";

    // Jeżeli nie ma walletName ALBO chcemy wymusić nowy, to POST /api/start_new_wallet
    if (!walletName || forceNew) {
      const requestData = {
        base_currency: baseCurrency,
        alternative_currency: alternativeCurrency,
        force_new: forceNew
      };

      try {
        console.log("🔹 Tworzymy (lub wymuszamy nowy) portfel:", requestData);
        const response = await fetch("http://localhost:5000/api/start_new_wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          throw new Error("Nie udało się utworzyć / sprawdzić portfela!");
        }

        const data = await response.json();
        console.log("✅ Odpowiedź serwera (wallet):", data);

        if (data.wallet_name) {
          localStorage.setItem("walletName", data.wallet_name);
        } else {
          throw new Error("Brak pola wallet_name w odpowiedzi serwera.");
        }
      } catch (err) {
        console.error("❌ Błąd przy tworzeniu portfela:", err);
        setError(err.message);
      } finally {
        // Usuwamy forceNew po jednorazowym użyciu
        localStorage.removeItem("forceNew");
      }
    }
  };

  // Aktualizacja endDate na podstawie startDate (+7 dni)
  const handleStartDateChange = (newStartDate) => {
    setStartDate(newStartDate);
    const startDateObj = new Date(newStartDate);
    const newEndDateObj = new Date(startDateObj);
    newEndDateObj.setDate(startDateObj.getDate() + 7);
    setEndDate(newEndDateObj.toISOString().split("T")[0]);
  };

  // Wywołujemy /api/predict
  const handlePrediction = async () => {
    let walletName = localStorage.getItem("walletName");
    if (!walletName) {
      console.error("❌ Brak nazwy portfela w localStorage!");
      return;
    }

    const requestData = {
      base_currency: baseCurrency,
      alternative_currency: alternativeCurrency,
      start_date: startDate,
      prediction_date: endDate,
    };

    console.log("🔹 Wysyłanie żądania predykcji:", requestData);

    fetch("http://localhost:5000/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Nie udało się pobrać danych predykcji.");
        }
        return response.json();
      })
      .then((data) => {
        console.log("✅ Odpowiedź predykcji:", data);
        setPredictionData(data);

        // Zapis do localStorage (DOTYCHCZAS):
        localStorage.setItem("startDate", startDate);
        localStorage.setItem("endDate", endDate);

        // NOWE: Zapisujemy również final_xgb, final_rf, final_lstm, final_arima
        if (data.final_xgb !== undefined) {
          localStorage.setItem("finalXgb", data.final_xgb);
        }
        if (data.final_rf !== undefined) {
          localStorage.setItem("finalRf", data.final_rf);
        }
        if (data.final_lstm !== undefined) {
          localStorage.setItem("finalLstm", data.final_lstm);
        }
        if (data.final_arima !== undefined) {
          localStorage.setItem("finalArima", data.final_arima);
        }

        // Zapisujemy predictions (obiekt) do localStorage w postaci JSON
        if (data.predictions) {
          localStorage.setItem("predictions", JSON.stringify(data.predictions));
        }

        // Zapisujemy investment_duration_months
        if (data.investment_duration_months !== undefined) {
          localStorage.setItem(
            "investmentDurationMonths",
            data.investment_duration_months
          );
        }

        // Jeżeli endpoint wciąż zwraca "predicted_close", można zapisać
        if (data.predicted_close !== undefined) {
          localStorage.setItem("predictedClose", data.predicted_close);
        }

        // Na koniec -> /prediction
        navigate("/prediction");
      })
      .catch((err) => {
        console.error("❌ Błąd przy pobieraniu danych predykcji:", err);
        setError(err.message);
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
          <span className="font-bold">Alternative Currency:</span>{" "}
          {alternativeCurrency}
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
    </div>
  );
}
