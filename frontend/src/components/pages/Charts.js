import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

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

        // Etykiety dat (tylko yyyy-mm-dd)
        const labels = data.investments.map((inv) =>
          new Date(inv.start_time).toISOString().split("T")[0]
        );

        // Wartości final_budget
        const values = data.investments.map((inv) => parseFloat(inv.final_budget).toFixed(2));

        // Kolorowanie punktów, w zależności od waluty (przykład)
        let colorArray = [];
        data.investments.forEach((inv) => {
          if (inv.currency_conversion) {
            colorArray.push("red"); // np. PLN
          } else {
            colorArray.push("rgb(75, 192, 192)"); // np. USD
          }
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
      .catch((err) => setError(err.message));
  }, [walletName]);

  return (
    <div className="w-full max-w-4xl bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-4">Investment Growth Chart</h2>

      {error ? (
        <p className="text-red-500">{error}</p>
      ) : chartData ? (
        <Line
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              y: {
                ticks: {
                  // Możesz wstawić symbol waluty, np.:
                  callback: function (value) {
                    return value + " ";
                  },
                },
              },
            },
          }}
        />
      ) : (
        <p className="text-lg text-gray-300">Loading chart...</p>
      )}
    </div>
  );
}
