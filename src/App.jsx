import Header from "./components/Header";
import Home from "./pages/Home";
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const App = () => {
  useEffect(() => {
    AOS.init({ once: false, duration: 700 });
  }, []);

  return (
    <div className="  bg-primary m-0 p-0">
      <Header />
      <Home />
    </div>
  );
};

export default App;
