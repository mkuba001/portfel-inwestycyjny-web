import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Charts({ walletName }) {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);

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

        // 🔹 Pobieramy etykiety dat (bez godzin)
        const labels = data.investments.map((investment) =>
          new Date(investment.start_time).toISOString().split("T")[0]
        );

        // 🔹 Pobieramy wartości budżetu
        const values = data.investments.map((investment) =>
          parseFloat(investment.final_budget).toFixed(2)
        );

        // 🔹 Ustalamy walutę początkową i przewalutowanie
        let currentCurrency = "USD";
        let colorArray = [];
        let currencyLabels = [];

        data.investments.forEach((investment, index) => {
          if (investment.currency_conversion) {
            currentCurrency = "PLN"; // Zmiana waluty po przewalutowaniu
          }
          colorArray.push(currentCurrency === "PLN" ? "red" : "rgb(75, 192, 192)");
          currencyLabels.push(currentCurrency);
        });

        setChartData({
          labels,
          datasets: [
            {
              label: "Investment Growth Over Time",
              data: values,
              borderColor: colorArray,
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderWidth: 3,
              pointBackgroundColor: colorArray,
              tension: 0.3,
            },
          ],
        });
      })
      .catch((error) => {
        setError(error.message);
      });
  }, [walletName]);

  return (
    <div className="w-full max-w-4xl bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-4">Investment Growth Chart</h2>

      {error ? (
        <p className="text-red-500">{error}</p>
      ) : chartData && (
        <Line
          data={chartData}
          options={{
            responsive: true,
            scales: {
              y: {
                ticks: {
                  callback: function (value, index, values) {
                    return `${value} ${index >= values.length - 1 ? "PLN" : "USD"}`;
                  },
                },
              },
            },
          }}
        />
      )}
    </div>
  );
}
