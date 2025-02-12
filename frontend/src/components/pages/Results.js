import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Charts from "./Charts";

export default function Results() {
  const [investments, setInvestments] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("results");
  const navigate = useNavigate();

  const walletName = localStorage.getItem("walletName");
  const baseCurrency = localStorage.getItem("baseCurrency") || "USD";
  const alternativeCurrency = localStorage.getItem("alternativeCurrency") || "PLN";

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
          // Rozdzielamy inwestycje na normalne, reverse oraz deposit na podstawie pola "scenario"
          const normalInvestments = data.investments.filter(
            (investment) =>
              investment.scenario &&
              investment.scenario.toLowerCase() === "normal"
          );
          const reverseInvestments = data.investments.filter(
            (investment) =>
              investment.scenario &&
              investment.scenario.toLowerCase() === "reverse"
          );
          const depositInvestments = data.investments.filter(
            (investment) =>
              investment.scenario &&
              investment.scenario.toLowerCase() === "deposit"
          );

          if (normalInvestments.length > 0) {
            localStorage.setItem(
              "lastFinalBudgetNormal",
              normalInvestments[normalInvestments.length - 1].final_budget
            );
          }
          if (reverseInvestments.length > 0) {
            localStorage.setItem(
              "lastFinalBudgetReverse",
              reverseInvestments[reverseInvestments.length - 1].final_budget
            );
          }
          // Dodajemy wynik symulacji lokaty do localStorage
          if (depositInvestments.length > 0) {
            localStorage.setItem(
              "lastDepositResult",
              depositInvestments[depositInvestments.length - 1].final_deposit_value
            );
          }
        } else {
          setError("No investments found in this wallet.");
        }
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [walletName]);

  const handleResetPortfolio = async () => {
    if (!walletName) {
      setError("No wallet to reset!");
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/reset_wallet/${walletName}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        throw new Error("Failed to reset the portfolio.");
      }
      // Usuwamy zapisy z localStorage
      localStorage.removeItem("lastFinalBudgetNormal");
      localStorage.removeItem("lastFinalBudgetReverse");
      localStorage.removeItem("lastDepositResult");
      setInvestments([]);
      navigate("/models");
    } catch (err) {
      console.error("Error resetting portfolio:", err);
      setError(err.message);
    }
  };

  const handleContinueInvestment = () => {
    navigate("/models");
  };

  const startNewInvestment = () => {
    localStorage.setItem("forceNew", "true");
    navigate("/forex-pair");
  };

  // Oddzielamy inwestycje forex od symulacji lokaty
  const depositInvestments = investments.filter(
    (investment) =>
      investment.scenario && investment.scenario.toLowerCase() === "deposit"
  );
  const forexInvestments = investments.filter(
    (investment) =>
      investment.scenario &&
      investment.scenario.toLowerCase() !== "deposit"
  );

  return (
    <div className="min-h-screen flex">
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
          onClick={handleResetPortfolio}
        >
          🔄 Reset Portfolio (Keep Wallet)
        </button>
        <button
          className="py-3 px-6 bg-green-500 text-white font-bold rounded-lg"
          onClick={handleContinueInvestment}
        >
          🔄 Continue Investment
        </button>
        <button
          className="py-3 px-6 bg-purple-500 text-white font-bold rounded-lg"
          onClick={startNewInvestment}
        >
          🆕 Start New Investment
        </button>
      </div>

      <div className="w-4/5 p-6 text-white">
        {activeTab === "results" ? (
          <>
            <h1 className="text-5xl font-bold mb-6">Investment Goal Results</h1>
            {error ? (
              <p className="text-lg text-red-500">{error}</p>
            ) : investments.length > 0 ? (
              <>
                <div className="w-full max-w-4xl bg-gray-800 p-6 rounded-lg shadow-lg mb-6">
                  <h2 className="text-3xl font-bold mb-4">
                    Forex Investment Results - Wallet: {walletName}
                  </h2>
                  <div className="space-y-6">
                    {forexInvestments.map((investment, index) => {
                      const isNormal =
                        investment.scenario &&
                        investment.scenario.toLowerCase() === "normal";
                      const startCurrency = isNormal ? baseCurrency : alternativeCurrency;
                      const finalCurrency = isNormal
                        ? (investment.currency_conversion ? alternativeCurrency : baseCurrency)
                        : (investment.currency_conversion ? baseCurrency : alternativeCurrency);
                      return (
                        <div key={index} className="border-b border-gray-600 pb-4">
                          <h3 className="text-xl font-bold text-sky-400 mb-2">
                            Investment {index + 1} – {investment.scenario?.toUpperCase()}
                          </h3>
                          <p>
                            <strong>Start Budget:</strong> {investment.start_budget} {startCurrency}
                          </p>
                          <p>
                            <strong>Final Budget:</strong> {investment.final_budget} {finalCurrency}
                          </p>
                          <p>
                            <strong>Start Time:</strong> {investment.start_time}
                          </p>
                          <p>
                            <strong>End Time:</strong> {investment.end_time}
                          </p>
                          <p>
                            <strong>Scenario Text:</strong> {investment.scenario_text}
                          </p>
                          <p>
                            <strong>Interest Rate:</strong> {investment.interest_rate}%
                          </p>
                          <p>
                            <strong>Exchange Rate used:</strong> {investment.user_exchange_rate}
                          </p>
                          <p>
                            <strong>Currency Conversion:</strong>{" "}
                            {investment.currency_conversion ? "Yes" : "No"}
                          </p>
                          <p>
                            <strong>Timestamp:</strong> {investment.timestamp}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {depositInvestments.length > 0 && (
                  <div className="w-full max-w-4xl bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-3xl font-bold mb-4">Deposit Simulation Results</h2>
                    <div className="space-y-6">
                      {depositInvestments.map((investment, index) => (
                        <div key={index} className="border-b border-gray-600 pb-4">
                          <h3 className="text-xl font-bold text-sky-400 mb-2">
                            Deposit Simulation {index + 1}
                          </h3>
                          <p>
                            <strong>Deposit Budget:</strong> {investment.deposit_budget}
                          </p>
                          <p>
                            <strong>Annual Rate:</strong> {investment.deposit_annual_rate}%
                          </p>
                          <p>
                            <strong>Duration (months):</strong> {investment.duration_months}
                          </p>
                          <p>
                            <strong>Final Deposit Value:</strong> {investment.final_deposit_value}
                          </p>
                          <p>
                            <strong>Timestamp:</strong> {investment.timestamp}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-lg text-gray-300">Loading or no investments found...</p>
            )}
          </>
        ) : (
          <Charts walletName={walletName} />
        )}
      </div>
    </div>
  );
}
