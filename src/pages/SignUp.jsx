import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/datePickerRange";
import PropTypes from "prop-types";

const steps = [
  "Basic Info",
  "Profile Info",
  "Skills & Learning Goals",
];

const skillCategories = [
  {
    label: "💻 Tech & Development",
    skills: [
      "Web Development (HTML, CSS, JavaScript...)",
      "Python Programming",
      "Mobile App Development",
      "Game Development",
      "Data Science",
      "UI/UX Design",
      "Machine Learning / AI",
      "Cybersecurity",
      "Blockchain",
      "SQL & Databases"
    ]
  },
  {
    label: "🎨 Creative Skills",
    skills: [
      "Graphic Design",
      "Photography",
      "Video Editing",
      "Illustration",
      "3D Modeling",
      "Music Production",
      "Writing / Copywriting",
      "Fashion Design",
      "Animation",
      "Digital Art (including AI art tools)"
    ]
  },
  {
    label: "🌍 Languages & Communication",
    skills: [
      "English",
      "French",
      "Dutch",
      "Spanish",
      "German",
      "Sign Language",
      "Public Speaking",
      "Writing Skills",
      "Translation",
      "Creative Writing"
    ]
  },
  {
    label: "📊 Business & Soft Skills",
    skills: [
      "Project Management",
      "Entrepreneurship",
      "Marketing (SEO, Social Media, Ads)",
      "Financial Management",
      "Networking",
      "Negotiation",
      "Leadership",
      "Time Management",
      "HR & Talent Development",
      "Research Methods"
    ]
  },
  {
    label: "🧘 Personal Growth",
    skills: [
      "Mindfulness",
      "Coaching / Mentoring",
      "Healthy Lifestyle",
      "Self-Discipline",
      "Emotional Intelligence",
      "Study Tips / Learning Techniques",
      "Work-Study Balance"
    ]
  },
  {
    label: "🛠️ Practical Skills",
    skills: [
      "Cooking / Baking",
      "DIY / Handyman Skills",
      "Gardening",
      "First Aid",
      "Car Maintenance",
      "Photo Editing",
      "Robotics"
    ]
  }
];

function MultiSelect({ label, options, selected, setSelected }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef();

  const filtered = options.map(cat => ({
    ...cat,
    skills: cat.skills.filter(skill => skill.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.skills.length > 0);

  function toggleSkill(skill) {
    if (selected.includes(skill)) {
      setSelected(selected.filter(s => s !== skill));
    } else {
      setSelected([...selected, skill]);
    }
  }

  useEffect(() => {
    function handleClick(e) {
      if (inputRef.current && !inputRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="mb-2">
      <label className="block text-sm font-medium mb-1 text-white">{label}</label>
      <div className="relative" ref={inputRef}>
        <input
          className="w-full px-3 py-2 bg-[#232b32] text-white rounded border border-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search skills..."
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selected.map(skill => (
              <span key={skill} className="bg-blue-600 text-white rounded-full px-3 py-1 text-xs flex items-center gap-1">
                {skill}
                <button type="button" className="ml-1" onClick={e => { e.stopPropagation(); toggleSkill(skill); }}>×</button>
              </span>
            ))}
          </div>
        )}
        {open && (
          <div className="absolute z-20 bg-[#232b32] border border-gray-700 rounded mt-1 w-full max-h-64 overflow-y-auto shadow-lg">
            {filtered.length === 0 && <div className="p-3 text-gray-400 text-sm">No skills found</div>}
            {filtered.map(cat => (
              <div key={cat.label}>
                <div className="px-3 py-2 text-xs text-gray-400 font-semibold">{cat.label}</div>
                {cat.skills.map(skill => (
                  <label key={skill} className="flex items-center px-3 py-1 cursor-pointer hover:bg-blue-900/30">
                    <input
                      type="checkbox"
                      checked={selected.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                      className="accent-blue-500 mr-2"
                    />
                    <span className="text-white text-sm">{skill}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

MultiSelect.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  selected: PropTypes.array.isRequired,
  setSelected: PropTypes.func.isRequired,
};

export default function SignUp() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    location: "",
    avatar: null,
    avatarUrl: "",
    skills: [],
    learning: [],
    availability: "",
    bio: "",
    social: ""
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef();


  function validateStep1() {
    const newErrors = {};
    if (!form.firstName) newErrors.firstName = "First name is required";
    if (!form.lastName) newErrors.lastName = "Last name is required";
    if (!form.email) newErrors.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) newErrors.email = "Invalid email address";
    if (!form.password) newErrors.password = "Password is required";
    if (form.password.length < 6) newErrors.password = "At least 6 characters";
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }
  function validateStep2() {
    const newErrors = {};
    if (!form.username) newErrors.username = "Username is required";
    if (!form.location) newErrors.location = "Location is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }
  function validateStep3() {
    const newErrors = {};
    if (form.skills.length === 0) newErrors.skills = "Add at least 1 skill";
    if (form.learning.length === 0) newErrors.learning = "Add at least 1 learning goal";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }


  function handleNext() {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;
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
  function handleSubmit(e) {
    e.preventDefault();
    if (!validateStep3()) return;
    setSubmitted(true);
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-4">
      <div className="w-full max-w-xl bg-[#181f25] rounded-2xl shadow-lg p-8 md:p-12">
        {/* Progress bar */}
        <div className="flex items-center mb-8">
          {steps.map((label, idx) => (
            <div key={label} className="flex-1 flex items-center">
              <div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-white ${step >= idx ? 'bg-blue-500' : 'bg-gray-700'}`}>{idx+1}</div>
              {idx < steps.length - 1 && <div className={`flex-1 h-1 mx-2 rounded ${step > idx ? 'bg-blue-500' : 'bg-gray-700'}`}></div>}
            </div>
          ))}
        </div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">🔐 Sign Up Details</h2>
        {submitted ? (
          <div className="text-green-400 text-center py-12 text-xl font-semibold">Registration successful! 🎉<br/>You can now log in.</div>
        ) : (
        <>
        {step === 0 && (
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1 text-white">First name</label>
              <Input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" className="bg-[#232b32] text-white" />
              {errors.firstName && <div className="text-red-400 text-xs mt-1">{errors.firstName}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Last name</label>
              <Input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" className="bg-[#232b32] text-white" />
              {errors.lastName && <div className="text-red-400 text-xs mt-1">{errors.lastName}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Email address</label>
              <Input name="email" value={form.email} onChange={handleChange} placeholder="Email address" className="bg-[#232b32] text-white" />
              {errors.email && <div className="text-red-400 text-xs mt-1">{errors.email}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Password</label>
              <Input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" className="bg-[#232b32] text-white" />
              {errors.password && <div className="text-red-400 text-xs mt-1">{errors.password}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Confirm password</label>
              <Input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password" className="bg-[#232b32] text-white" />
              {errors.confirmPassword && <div className="text-red-400 text-xs mt-1">{errors.confirmPassword}</div>}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white px-6">Next →</Button>
            </div>
          </form>
        )}
        {step === 1 && (
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Profile picture <span className="text-xs text-gray-400">(optional)</span></label>
              <div className="flex items-center gap-4">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <Button type="button" onClick={() => fileInputRef.current.click()} className="bg-blue-600 hover:bg-blue-700 text-white">Upload</Button>
                {form.avatarUrl && <img src={form.avatarUrl} alt="preview" className="w-14 h-14 rounded-full border-2 border-blue-500 object-cover" />}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Username</label>
              <Input name="username" value={form.username} onChange={handleChange} placeholder="Username" className="bg-[#232b32] text-white" />
              {errors.username && <div className="text-red-400 text-xs mt-1">{errors.username}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Location (city or region)</label>
              <Input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Amsterdam" className="bg-[#232b32] text-white" />
              {errors.location && <div className="text-red-400 text-xs mt-1">{errors.location}</div>}
            </div>
            <div className="flex justify-between gap-2 pt-4">
              <Button type="button" onClick={handlePrev} className="bg-gray-700 text-white">← Previous</Button>
              <Button type="button" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white px-6">Next →</Button>
            </div>
          </form>
        )}
        {step === 2 && (
          submitted ? (
            <div className="text-green-400 text-center py-12 text-xl font-semibold">Registration successful! 🎉<br/>You can now log in.</div>
          ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <MultiSelect
              label="👨‍🎓 Which skills do you offer?"
              options={skillCategories}
              selected={form.skills}
              setSelected={skills => setForm(f => ({ ...f, skills }))}
            />
            <MultiSelect
              label="🎯 What do you want to learn?"
              options={skillCategories}
              selected={form.learning}
              setSelected={learning => setForm(f => ({ ...f, learning }))}
            />
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Availability <span className="text-xs text-gray-400">(optional)</span></label>
              <DatePickerWithRange className="w-full max-w-xs" onSelect={val => setForm(f => ({ ...f, availability: val }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Short bio <span className="text-xs text-gray-400">(optional, max. 200 characters)</span></label>
              <Input name="bio" value={form.bio} onChange={handleChange} maxLength={200} placeholder="Tell something about yourself..." className="bg-[#232b32] text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Social media / portfolio link <span className="text-xs text-gray-400">(optional)</span></label>
              <Input name="social" value={form.social} onChange={handleChange} placeholder="e.g. LinkedIn, GitHub, website..." className="bg-[#232b32] text-white" />
            </div>
            <div className="flex justify-between gap-2 pt-4">
              <Button type="button" onClick={handlePrev} className="bg-gray-700 text-white">← Previous</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Sign Up</Button>
            </div>
          </form>
          )
        )}
        </>
        )}
      </div>
    </div>
  );
}