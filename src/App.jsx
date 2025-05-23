import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Footer from "./components/Footer";

const App = () => {
  useEffect(() => {
    AOS.init({ once: false, duration: 700 });
  }, []);

  return (
    <BrowserRouter>
      <div className="  bg-primary m-0 p-0">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
