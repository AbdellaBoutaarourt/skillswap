import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/datePickerRange";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";
import loginImg from "../assets/Login.png";
import connectImg from "../assets/connect.jpg";
import progressImg from "../assets/matshup.jpg";
import { Label } from "../components/ui/label";
import { createClient } from '@supabase/supabase-js';
import defaultAvatar from "../assets/user.png";
import MultiSelect from "@/components/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const slides = [
  {
    image: loginImg,
    title: "Start Your Journey",
    description: "Join our community of learners and teachers. Share your expertise and discover new skills."
  },
  {
    image: connectImg,
    title: "Connect & Collaborate",
    description: "Find the perfect match for your skills. Our AI-powered system helps you connect with like-minded people."
  },
  {
    image: progressImg,
    title: "Grow Together",
    description: "Learn from others while sharing your knowledge. Create meaningful connections and projects."
  }
];

const steps = [
  "Basic Info",
  "Profile Info",
  "Skills & Learning Goals",
];

export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [skillCategories, setSkillCategories] = useState([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    location: "",
    avatarUrl: "",
    skills: [],
    learning: [],
    availability: "",
    bio: "",
    social: ""
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef();
  const [countries, setCountries] = useState([]);

  const checkEmailExists = async (email) => {
    try {
      const { data } = await axios.get(`http://localhost:5000/users/check-email/${email}`);
      return data.exists;
    } catch (err) {
      console.error('Error checking email:', err);
      return false;
    }
  };

  const checkUsernameExists = async (username) => {
    try {
      const { data } = await axios.get(`http://localhost:5000/users/check-username/${username}`);
      return data.exists;
    } catch (err) {
      console.error('Error checking username:', err);
      return false;
    }
  };

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/skills');
        const categories = [...new Set(data.map(skill => skill.category))];
        const formattedCategories = categories.map(category => ({
          label: category,
          skills: data.filter(skill => skill.category === category).map(skill => skill.name)
        }));
        setSkillCategories(formattedCategories);
      } catch (err) {
        console.error('Error fetching skills:', err);
      }
    };

    fetchSkills();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('https://countriesnow.space/api/v0.1/countries/positions')
      .then(res => res.json())
      .then(data => {
        setCountries(data.data);
      });
  }, []);

  async function validateStep1() {
    const newErrors = {};
    if (!form.firstName) newErrors.firstName = "First name is required";
    if (!form.lastName) newErrors.lastName = "Last name is required";
    if (!form.email) newErrors.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) newErrors.email = "Invalid email address";
    else {
      const emailExists = await checkEmailExists(form.email);
      if (emailExists) newErrors.email = "This email is already registered";
    }
    if (!form.password) newErrors.password = "Password is required";
    if (form.password.length < 6) newErrors.password = "At least 6 characters";
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }
  async function validateStep2() {
    const newErrors = {};
    if (!form.username) {
      newErrors.username = "Username is required";
    } else {
      const usernameExists = await checkUsernameExists(form.username);
      if (usernameExists) {
        newErrors.username = "This username is already taken";
      }
    }
    if (!form.location) newErrors.location = "Location is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }
  function validateStep3() {
    const newErrors = {};

    if (!Array.isArray(form.skills) || form.skills.length === 0) {
      newErrors.skills = "Please select at least one skill you can offer";
    }
    if (!Array.isArray(form.learning) || form.learning.length === 0) {
      newErrors.learning = "Please select at least one skill you want to learn";
    }

    if (Array.isArray(form.skills) && Array.isArray(form.learning) &&
        form.skills.length > 0 && form.learning.length > 0) {
      const commonSkills = form.skills.filter(skill => form.learning.includes(skill));
      if (commonSkills.length > 0) {
        newErrors.skills = "You cannot offer and learn the same skill";
        newErrors.learning = "You cannot offer and learn the same skill";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleNext() {
    if (step === 0 && !(await validateStep1())) return;
    if (step === 1 && !(await validateStep2())) return;
    if (step === 2 && !validateStep3()) return;
    setErrors({});
    setStep(step + 1);
  }
  function handlePrev() {
    setErrors({});
    setStep(step - 1);
  }
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, avatar: file, avatarUrl: URL.createObjectURL(file) });
    }
  }
  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateStep3()) {
      return;
    }

    setIsLoading(true);
    try {
      let avatarUrl = form.avatarUrl;

      if (form.avatar) {
        const fileName = `${form.username}_${Date.now()}.${form.avatar.name.split('.').pop()}`;
        const { error } = await supabase.storage
          .from('avatars')
          .upload(fileName, form.avatar);


        const { data: { publicUrl } } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(fileName);
          if (error) throw error;

        avatarUrl = publicUrl;
      }

      const formData = {
        email: form.email,
        password: form.password,
        username: form.username,
        firstName: form.firstName,
        lastName: form.lastName,
        location: form.location,
        bio: form.bio,
        skills: form.skills || [],
        learning: form.learning || [],
        availability: Array.isArray(form.availability) && form.availability.length === 2
          ? [
          new Date(form.availability.from).toISOString().split("T")[0],
          new Date(form.availability.to).toISOString().split("T")[0]
            ]
          : [],
        social: form.social,
        avatar: avatarUrl
      };

      const response = await axios.post('http://localhost:5000/users/signup', formData);

      if (response.data) {
        setSubmitted(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({
        submit: error.response?.data?.error || 'An error occurred during signup'
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className=" flex items-center justify-center bg-primary p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl shadow-2xl flex flex-col-reverse md:flex-row w-full max-w-6xl overflow-hidden bg-[#232b32]"
      >
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center text-white">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              src={logo}
              alt="SkillSwap Logo "
              className="h-16 md:h-20 mx-auto mb-6"
            />
            <div className="flex items-center mb-8">
              {steps.map((label, idx) => (
                <div key={label} className="flex-1 flex items-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 * idx }}
                    className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-white ${
                      step >= idx ? 'bg-blue-500' : 'bg-gray-700'
                    }`}
                  >
                    {idx + 1}
                  </motion.div>
                  {idx < steps.length - 1 && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.2 * idx + 0.1 }}
                      className={`flex-1 h-1 mx-2 rounded ${
                        step > idx ? 'bg-blue-500' : 'bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-green-400 text-center py-12 text-xl font-semibold"
            >
              Registration successful! 🎉<br/>
              Please check your email for verification link.<br/>
              Redirecting to login...
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {step === 0 && (
                <motion.form
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div>
                    <Label htmlFor="firstName" className="text-white mb-2">First name</Label>
                    <Input name="firstName" id="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" className="bg-[#232b32] text-white" />
                    {errors.firstName && <div className="text-red-400 text-xs mt-1">{errors.firstName}</div>}
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-white mb-2">Last name</Label>
                    <Input name="lastName" id="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" className="bg-[#232b32] text-white" />
                    {errors.lastName && <div className="text-red-400 text-xs mt-1">{errors.lastName}</div>}
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white mb-2">Email address</Label>
                    <Input name="email" id="email" value={form.email} onChange={handleChange} placeholder="Email address" className="bg-[#232b32] text-white" />
                    {errors.email && <div className="text-red-400 text-xs mt-1">{errors.email}</div>}
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-white mb-2">Password</Label>
                    <Input name="password" id="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" className="bg-[#232b32] text-white" />
                    {errors.password && <div className="text-red-400 text-xs mt-1">{errors.password}</div>}
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword" className="text-white mb-2">Confirm password</Label>
                    <Input name="confirmPassword" id="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password" className="bg-[#232b32] text-white" />
                    {errors.confirmPassword && <div className="text-red-400 text-xs mt-1">{errors.confirmPassword}</div>}
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white px-6">Next →</Button>
                  </div>
                </motion.form>
              )}
              {step === 1 && (
                <motion.form
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div>
                    <Label htmlFor="avatar" className="text-white">Profile picture <span className="text-xs text-gray-400">(optional)</span></Label>
                    <div className="flex items-center gap-4">
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      <Button type="button" onClick={() => fileInputRef.current.click()} className="bg-blue-600 hover:bg-blue-700 text-white">Upload</Button>
                      <img
                        src={form.avatarUrl || defaultAvatar}
                        alt="profile preview"
                        className="w-14 h-14 rounded-full border-2 border-blue-500 object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="username" className="text-white mb-2">Username</Label>
                    <Input name="username" id="username" value={form.username} onChange={handleChange} placeholder="Username" className="bg-[#232b32] text-white" />
                    {errors.username && <div className="text-red-400 text-xs mt-1">{errors.username}</div>}
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-white mb-2">Country</Label>
                    <Select value={form.location} onValueChange={value => setForm(f => ({ ...f, location: value }))}>
                      <SelectTrigger className="w-full bg-[#232b32] text-white">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#232b32] text-white">
                        {countries.map(c => (
                          <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.location && <div className="text-red-400 text-xs mt-1">{errors.location}</div>}
                  </div>
                  <div className="flex justify-between gap-2 pt-4">
                    <Button type="button" onClick={handlePrev} className="bg-gray-700 text-white">← Previous</Button>
                    <Button type="button" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white px-6">Next →</Button>
                  </div>
                </motion.form>
              )}
              {step === 2 && (
                <motion.form
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                  onSubmit={handleSubmit}
                >
                  <MultiSelect
                    label="👨‍🎓 Which skills do you offer?"
                    options={skillCategories}
                    selected={form.skills}
                    setSelected={skills => setForm(f => ({ ...f, skills }))}
                  />
                  {errors.skills && <div className="text-red-400 text-xs mt-1">{errors.skills}</div>}

                  <MultiSelect
                    label="🎯 What do you want to learn?"
                    options={skillCategories}
                    selected={form.learning}
                    setSelected={learning => setForm(f => ({ ...f, learning }))}
                  />
                  {errors.learning && <div className="text-red-400 text-xs mt-1">{errors.learning}</div>}

                  <div>
                    <Label htmlFor="availability" className="text-white mb-2">Availability <span className="text-xs text-gray-400">(optional)</span></Label>
                    <DatePickerWithRange className="w-full max-w-xs" onSelect={val => setForm(f => ({ ...f, availability: val }))} />
                  </div>
                  <div>
                    <Label htmlFor="bio" className="text-white mb-2">Short bio <span className="text-xs text-gray-400">(optional, max. 200 characters)</span></Label>
                    <Input name="bio" id="bio" value={form.bio} onChange={handleChange} maxLength={200} placeholder="Tell something about yourself..." className="bg-[#232b32] text-white" />
                  </div>
                  <div>
                    <Label htmlFor="social" className="text-white mb-2">Social media / portfolio link <span className="text-xs text-gray-400">(optional)</span></Label>
                    <Input name="social" id="social" value={form.social} onChange={handleChange} placeholder="e.g. LinkedIn, GitHub, website..." className="bg-[#232b32] text-white" />
                  </div>
                  {errors.submit && (
                    <div className="text-red-400 text-sm">{errors.submit}</div>
                  )}
                  <div className="flex justify-between gap-2 pt-4">
                    <Button type="button" onClick={handlePrev} className="bg-gray-700 text-white">← Previous</Button>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing up...' : 'Sign Up'}
                    </Button>
                  </div>
                </motion.form>
              )}
            </motion.div>
          )}
        </div>

        <div className="hidden md:flex md:w-1/2 bg-white flex-col justify-center items-center p-8 relative overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              {slides.map((slide, index) => (
                currentSlide === index && (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                    className="absolute w-full text-center"
                  >
                    <motion.img
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5 }}
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-80 object-contain mb-6 rounded-lg shadow-lg"
                    />
                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-bold mb-3 text-[#232b32]"
                    >
                      {slide.title}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-gray-600 text-lg"
                    >
                      {slide.description}
                    </motion.p>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-3">
            {slides.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentSlide(index)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  currentSlide === index ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}