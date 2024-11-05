import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate('/forex-pair');
  };

  return (
    <main className="flex flex-col items-center justify-center container mx-auto p-4 mt-10 sm:mt-16 md:mt-20 lg:mt-24">
      <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 text-center max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mb-6 sm:mb-8">
        Welcome to the Forex Pairs page. Here, you can explore different currency pairs and analyze their trends using advanced AI-powered tools.
      </p>
      <button
        onClick={handleButtonClick}
        className="bg-sky-500 hover:bg-sky-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-base sm:text-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
      >
        Start NOW
      </button>
    </main>
  );
}
