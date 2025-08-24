import React, { useState, useEffect } from 'react';
import { Play, Coffee, Utensils } from 'lucide-react';

interface WelcomeScreenProps {
  onEnter: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter }) => {
  const [logoAnimation, setLogoAnimation] = useState(false);
  const [textAnimation, setTextAnimation] = useState(false);
  const [buttonAnimation, setButtonAnimation] = useState(false);

  useEffect(() => {
    // Secuencia de animaciones
    const timer1 = setTimeout(() => setLogoAnimation(true), 300);
    const timer2 = setTimeout(() => setTextAnimation(true), 800);
    const timer3 = setTimeout(() => setButtonAnimation(true), 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Logo con animación */}
        <div className="text-center mb-12">
          <div className={`relative inline-block mb-6 transition-all duration-1000 ease-out ${
            logoAnimation ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}>
            {/* Círculo de fondo con animación de entrada */}
            <div className={`w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-2xl transition-all duration-1000 ease-out ${
              logoAnimation ? 'rotate-0 scale-100' : 'rotate-180 scale-0'
            }`}>
              {/* Iconos del logo con animación escalonada */}
              <div className="relative">
                <Coffee className={`w-16 h-16 text-white transition-all duration-700 ease-out delay-300 ${
                  logoAnimation ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                }`} />
                <Utensils className={`w-8 h-8 text-yellow-300 absolute -bottom-2 -right-2 transition-all duration-700 ease-out delay-500 ${
                  logoAnimation ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-180'
                }`} />
              </div>
            </div>
            {/* Anillo decorativo con animación pulsante */}
            <div className={`absolute inset-0 border-4 border-blue-400/30 rounded-full transition-all duration-1000 ease-out delay-700 ${
              logoAnimation ? 'animate-pulse opacity-100' : 'opacity-0'
            }`}></div>
            
            {/* Partículas flotantes */}
            <div className={`absolute -top-4 -left-4 w-3 h-3 bg-blue-400 rounded-full transition-all duration-1000 ease-out delay-900 ${
              logoAnimation ? 'animate-bounce opacity-60' : 'opacity-0'
            }`}></div>
            <div className={`absolute -top-2 -right-6 w-2 h-2 bg-indigo-400 rounded-full transition-all duration-1000 ease-out delay-1000 ${
              logoAnimation ? 'animate-bounce opacity-60' : 'opacity-0'
            }`} style={{ animationDelay: '0.5s' }}></div>
            <div className={`absolute -bottom-4 -right-2 w-2.5 h-2.5 bg-purple-400 rounded-full transition-all duration-1000 ease-out delay-1100 ${
              logoAnimation ? 'animate-bounce opacity-60' : 'opacity-0'
            }`} style={{ animationDelay: '1s' }}></div>
          </div>
          
          {/* Nombre del programa con animación de escritura */}
          <h1 className={`text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-2 transition-all duration-1000 ease-out ${
            textAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <span className="inline-block">kimi</span>
            <span className="inline-block text-indigo-800">POS</span>
          </h1>
          <p className={`text-lg text-gray-600 font-medium transition-all duration-1000 ease-out delay-200 ${
            textAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            Sistema de Punto de Venta
          </p>
          <p className={`text-sm text-gray-500 mt-1 transition-all duration-1000 ease-out delay-400 ${
            textAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            Gestión inteligente para tu negocio
          </p>
        </div>

        {/* Botón de entrada con animación */}
        <div className={`text-center transition-all duration-1000 ease-out ${
          buttonAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <button
            onClick={onEnter}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 mx-auto"
          >
            <Play className="w-5 h-5" />
            <span>Entrar al Sistema</span>
          </button>
        </div>

        {/* Información adicional con animación */}
        <div className={`text-center mt-8 text-sm text-gray-500 transition-all duration-1000 ease-out delay-600 ${
          buttonAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <p>Versión 1.0</p>
          <p className="mt-1">© 2024 kimiPOS - Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
