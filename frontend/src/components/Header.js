import { useNavigate } from 'react-router-dom';  // Import useNavigate
import logo from '../images/logo.png';

export default function Header() {
  const navigate = useNavigate();  // Użycie useNavigate

  const handleLogoClick = () => {
    navigate('/');  // Przekierowanie do strony głównej
  };

  return (
    <header className="bg-gray-800 p-6 shadow-lg">
      <div className="container mx-auto flex flex-col items-center">
        <img
          src={logo}
          alt="logo"
          className="w-24 h-24 object-contain shadow-lg cursor-pointer"
          onClick={handleLogoClick}  // Przekierowanie po kliknięciu logo
        />
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 mt-4 shadow-lg transition-transform duration-300 hover:scale-105">
          Forex & AI Investment
        </h1>
        <p className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-amber-400 mt-2 shadow-md">
          Unlock the power of AI in the Forex market
        </p>
      </div>
    </header>
  );
}
