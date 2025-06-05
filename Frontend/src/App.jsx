import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Footer from "./components/Footer";
import Explore from "./pages/Explore";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import User from "./pages/User";
import Messages from "./pages/Messages";
import Sessions from "./pages/Sessions";
import JoinSession from "./pages/JoinSession";
import SkillMashups from "./pages/SkillMashups";

const App = () => {
  useEffect(() => {
    AOS.init({ once: false, duration: 700 });
  }, []);

  return (
    <BrowserRouter>
    <div className=" min-h-screen bg-primary m-0 p-0">
      <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile/:id" element={<User />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:userId" element={<Messages />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/session/:sessionId" element={<JoinSession />} />
          <Route path="/mashups" element={<SkillMashups />} />
        </Routes>
        <Footer />
    </div>
    </BrowserRouter>
  );
};

export default App;
