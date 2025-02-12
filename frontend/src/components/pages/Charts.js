import React, { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns"; // Upewnij się, że moduł jest zainstalowany (npm install chartjs-adapter-date-fns)

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Charts({ walletName }) {
  // Stany dla wykresów inwestycyjnych
  const [combinedLineChartData, setCombinedLineChartData] = useState(null);
  const [profitLossBarData, setProfitLossBarData] = useState(null);
  // Stan dla wykresu predykcji vs. danych historycznych
  const [predictionsChartData, setPredictionsChartData] = useState(null);
  const [error, setError] = useState(null);

  // --- Inwestycje: Combined Line Chart & Aggregated Profit/Loss Bar Chart ---
  useEffect(() => {
    if (!walletName) {
      setError("No investment wallet selected.");
      return;
    }

    fetch(`http://localhost:5000/api/get_wallet_data/${walletName}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.investments || data.investments.length === 0) {
          setError("No investments found.");
          return;
        }

        // Podział inwestycji według kategorii
        const forexNormal = data.investments.filter(
          (inv) =>
            inv.scenario && inv.scenario.toLowerCase() === "normal"
        );
        const forexReverse = data.investments.filter(
          (inv) =>
            inv.scenario && inv.scenario.toLowerCase() === "reverse"
        );
        const depositInv = data.investments.filter(
          (inv) =>
            inv.scenario && inv.scenario.toLowerCase() === "deposit"
        );

        // --- Combined Line Chart ---
        // Forex: dla każdej inwestycji generujemy dwa punkty:
        //  - punkt początkowy: data start_time, wartość start_budget
        //  - punkt końcowy: data end_time, wartość final_budget
        const normalData = forexNormal.flatMap((inv) => [
          { x: new Date(inv.start_time), y: parseFloat(inv.start_budget) },
          { x: new Date(inv.end_time), y: parseFloat(inv.final_budget) },
        ]).sort((a, b) => a.x - b.x);

        const reverseData = forexReverse.flatMap((inv) => [
          { x: new Date(inv.start_time), y: parseFloat(inv.start_budget) },
          { x: new Date(inv.end_time), y: parseFloat(inv.final_budget) },
        ]).sort((a, b) => a.x - b.x);

        // Deposit: dla każdej lokaty generujemy dwa punkty:
        //  - punkt początkowy: data start_time, wartość deposit_budget
        //  - punkt końcowy: data end_time, wartość final_deposit_value
        let depositData = [];
        if (depositInv.length > 0) {
          depositData = depositInv.flatMap((inv) => [
            { x: new Date(inv.start_time), y: parseFloat(inv.deposit_budget) },
            { x: new Date(inv.end_time), y: parseFloat(inv.final_deposit_value) },
          ]);
          depositData.sort((a, b) => a.x - b.x);
        }

        setCombinedLineChartData({
          datasets: [
            {
              label: "Normal Investment",
              data: normalData,
              borderColor: "rgb(75, 192, 192)",
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderWidth: 3,
              tension: 0.3,
            },
            {
              label: "Reverse Investment",
              data: reverseData,
              borderColor: "red",
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              borderWidth: 3,
              tension: 0.3,
            },
            {
              label: "Deposit",
              data: depositData,
              borderColor: "blue",
              backgroundColor: "rgba(0, 0, 255, 0.2)",
              borderWidth: 3,
              tension: 0.3,
            },
          ],
        });

        // --- Aggregated Profit/Loss Bar Chart ---
        const normalPL = forexNormal.reduce((acc, inv) => {
          const profit = parseFloat(inv.final_budget) - parseFloat(inv.start_budget);
          return acc + profit;
        }, 0);
        const reversePL = forexReverse.reduce((acc, inv) => {
          const profit = parseFloat(inv.final_budget) - parseFloat(inv.start_budget);
          return acc + profit;
        }, 0);
        const depositPL = depositInv.reduce((acc, inv) => {
          const profit = parseFloat(inv.final_deposit_value) - parseFloat(inv.deposit_budget);
          return acc + profit;
        }, 0);
        const barColors = [normalPL, reversePL, depositPL].map((value) =>
          value >= 0 ? "green" : "red"
        );

        setProfitLossBarData({
          labels: ["Normal Investment", "Reverse Investment", "Deposit"],
          datasets: [
            {
              label: "Aggregated P&L",
              data: [normalPL, reversePL, depositPL],
              backgroundColor: barColors,
              borderColor: barColors,
              borderWidth: 1,
            },
          ],
        });
      })
      .catch((err) => setError(err.message));
  }, [walletName]);

  // --- Predictions vs. Historical Chart ---
  useEffect(() => {
    // Odczyt danych predykcyjnych z localStorage
    const predsStr = localStorage.getItem("predictions");
    let predsObj = null;
    if (predsStr) {
      try {
        predsObj = JSON.parse(predsStr);
      } catch (err) {
        console.error("Error parsing predictions JSON:", err);
        setError("Error parsing predictions data.");
        return;
      }
    } else {
      setError("No predictions data found in localStorage.");
      return;
    }

    // Pobieramy dane historyczne z endpointu /api/historical-data
    // Używamy wartości z localStorage: startDate, a jako datę końcową wykorzystujemy prediction_date (jeśli dostępna) lub endDate
    const startDateLS = localStorage.getItem("startDate");
    // Aby wykres obejmował pełen okres predykcji, pobieramy prediction_date (np. 25.03) zamiast endDate, jeśli jest dostępna
    const predictionDate = localStorage.getItem("prediction_date") || localStorage.getItem("endDate");
    const baseCurrency = localStorage.getItem("baseCurrency") || "USD";
    const alternativeCurrency = localStorage.getItem("alternativeCurrency") || "PLN";

    if (!startDateLS || !predictionDate) {
      setError("Missing startDate or prediction_date/endDate in localStorage.");
      return;
    }

    // Jeśli model wykorzystuje 60-dniowy lag, możemy ustalić, że dane historyczne zaczynają się 60 dni przed startDate.
    const startDateObj = new Date(startDateLS);
    startDateObj.setDate(startDateObj.getDate() - 60);
    const formattedStartDate = startDateObj.toISOString().split("T")[0];

    const url = `http://localhost:5000/api/historical-data?base=${baseCurrency}&alt=${alternativeCurrency}&start_date=${formattedStartDate}&end_date=${predictionDate}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch historical data.");
        }
        return res.json();
      })
      .then((histData) => {
        if (!histData.historical || histData.historical.length === 0) {
          setError("No historical data available.");
          return;
        }

        // Budujemy wykres predykcji vs. historycznych danych.
        // Używamy etykiet z jednej z tablic predykcyjnych (np. predictions_xgboost)
        const labels = predsObj.predictions_xgboost.map((item) => item.Date);
        const datasets = [];

        if (predsObj.predictions_xgboost) {
          datasets.push({
            label: "XGBoost Prediction",
            data: predsObj.predictions_xgboost.map((item) => item.Predicted),
            borderColor: "#8884d8",
            backgroundColor: "rgba(136,132,216,0.5)",
            fill: false,
          });
        }
        if (predsObj.predictions_rf) {
          datasets.push({
            label: "RF Prediction",
            data: predsObj.predictions_rf.map((item) => item.Predicted),
            borderColor: "#82ca9d",
            backgroundColor: "rgba(130,202,157,0.5)",
            fill: false,
          });
        }
        if (predsObj.predictions_lstm) {
          datasets.push({
            label: "LSTM Prediction",
            data: predsObj.predictions_lstm.map((item) => item.Predicted),
            borderColor: "#ffc658",
            backgroundColor: "rgba(255,198,88,0.5)",
            fill: false,
          });
        }
        if (predsObj.predictions_arima) {
          datasets.push({
            label: "ARIMA Prediction",
            data: predsObj.predictions_arima.map((item) => item.Predicted),
            borderColor: "#ff7300",
            backgroundColor: "rgba(255,115,0,0.5)",
            fill: false,
          });
        }
        // Dodajemy serię dla historycznych danych – zakładamy, że histData.historical to tablica obiektów { Date, Close }
        datasets.push({
          label: "Historical Actual",
          data: histData.historical.map((item) => item.Close),
          borderColor: "black",
          backgroundColor: "rgba(0,0,0,0.5)",
          fill: false,
          borderWidth: 3,
        });

        setPredictionsChartData({ labels, datasets });
      })
      .catch((err) => {
        console.error("Error fetching historical data:", err);
        setError(err.message);
      });
  }, []);

  // Opcje wykresów
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: "Investments & Deposit Over Time" },
    },
    scales: {
      x: {
        type: "time",
        time: { unit: "day" },
        title: { display: true, text: "Date" },
      },
      y: {
        title: { display: true, text: "Value" },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Aggregated Profit / Loss" },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "P&L" },
      },
    },
  };

  const predictionsChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Predictions vs. Historical Actual" },
    },
    scales: {
      x: {
        type: "time",
        time: { unit: "day" },
        title: { display: true, text: "Date" },
      },
      y: {
        title: { display: true, text: "Value" },
      },
    },
  };

  return (
    <div className="w-full max-w-4xl bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-4">Investment Charts</h2>
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          {/* Inwestycje: Combined Line Chart */}
          {combinedLineChartData ? (
            <div className="mb-8">
              <Line data={combinedLineChartData} options={lineChartOptions} />
            </div>
          ) : (
            <p className="text-lg text-gray-300">Loading combined chart...</p>
          )}
          {/* Inwestycje: Aggregated Profit/Loss Bar Chart */}
          {profitLossBarData ? (
            <Bar data={profitLossBarData} options={barChartOptions} />
          ) : (
            <p className="text-lg text-gray-300">Loading profit/loss chart...</p>
          )}
          {/* Predykcje vs. Dane Historyczne */}
          {predictionsChartData ? (
            <div className="mt-8">
              <Line data={predictionsChartData} options={predictionsChartOptions} />
            </div>
          ) : (
            <p className="text-lg text-gray-300 mt-8">
              Loading predictions and historical data...
            </p>
          )}
        </>
      )}
    </div>
  );
}
