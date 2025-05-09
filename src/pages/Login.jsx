import { useState, useEffect } from 'react';
import logo from '../assets/logo.png';
import loginImg from '../assets/Login.png';
import connectImg from '../assets/connect.jpg';
import progressImg from '../assets/matshup.jpg';

const Login = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: loginImg,
      title: "Learn, Share and Combine Skills",
      description: "Explore a world where learning is mutual. Share what you know, learn what you need, and collaborate on something great."
    },
    {
      image: connectImg,
      title: "Connect With Like-Minded People",
      description: "Find people who match your interests and availability. Whether you're here to teach or learn, you're not alone."
    },
    {
      image: progressImg,
      title: "Create Something Extraordinary",
      description: "Mix your skills with others through our AI-powered Skill Matchups and bring unique projects to life."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);


  return (
    <div className=" flex items-center justify-center bg-primary p-4">
      <div className="rounded-2xl shadow-lg flex flex-col-reverse md:flex-row w-full max-w-6xl overflow-hidden">
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-[#232b32] text-white">
          <div className="mb-8 md:mb-10 text-center">
            <img src={logo} alt="SkillSwap Logo" className="h-14 md:h-16 mx-auto mb-4 md:mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold">Welcome Back!</h2>
            <p className="text-gray-400 text-base md:text-lg mt-2">Sign in to continue your skill exchange journey</p>
          </div>

          <form className="space-y-6 md:space-y-8">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 md:px-5 py-2 md:py-3 rounded-lg bg-[#1a1f24] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 md:px-5 py-2 md:py-3 rounded-lg bg-[#1a1f24] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 md:h-5 w-4 md:w-5 rounded border-gray-700 bg-[#1a1f24] text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="remember" className="ml-2 md:ml-3 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm text-blue-400 hover:text-blue-300">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full py-2 cursor-pointer md:py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 text-base md:text-lg"
            >
              Sign In
            </button>
          </form>

          <p className="mt-6 md:mt-8 text-center text-gray-400 text-base md:text-lg">
            Don&apos;t have an account?{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign up
            </a>
          </p>
        </div>

        <div className="hidden md:flex md:w-1/2 bg-white flex-col justify-center items-center p-6 md:p-10 relative">
          <div className="relative w-full h-full flex items-center justify-center">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute w-full transition-opacity duration-500 ${
                  currentSlide === index ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full md:h-80 rounded-lg object-contain mb-4 md:mb-6"
                />
                <h3 className="text-xl md:text-2xl font-bold text-center mb-2 md:mb-4 text-[#232b32]">
                  {slide.title}
                </h3>
                <p className="text-gray-600 text-center text-base md:text-lg mb-2 md:mb-4">
                  {slide.description}
                </p>
              </div>
            ))}
          </div>

          <div className="absolute bottom-4 md:bottom-8 left-0 right-0 flex justify-center space-x-2 md:space-x-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 md:w-3 h-2 md:h-3 rounded-full transition-colors duration-200 ${
                  currentSlide === index ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;