import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  function validateForm() {
    const newErrors = {};
    if (!form.email) newErrors.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) newErrors.email = "Invalid email address";
    if (!form.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleResendConfirmation() {
    setIsResending(true);
    try {
      await axios.post('http://localhost:5000/users/resend-confirmation', { email: form.email });
      setErrors({
        submit: "Confirmation email has been resent. Please check your inbox."
      });
    } catch (error) {
      setErrors({
        submit: error.response?.data?.error || "Failed to resend confirmation email"
      });
    } finally {
      setIsResending(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/users/login', form);

      if (response.data) {
        localStorage.setItem('session', JSON.stringify(response.data.session));
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'An error occurred during login';
      setErrors({
        submit: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md bg-[#181f25] rounded-2xl shadow-lg p-8 md:p-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">🔐 Login</h2>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1 text-white">Email address</label>
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email address"
              className="bg-[#232b32] text-white"
            />
            {errors.email && <div className="text-red-400 text-xs mt-1">{errors.email}</div>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white">Password</label>
            <Input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="bg-[#232b32] text-white"
            />
            {errors.password && <div className="text-red-400 text-xs mt-1">{errors.password}</div>}
          </div>

          {errors.submit && (
            <div className="space-y-2">
              <div className="text-red-400 text-sm">{errors.submit}</div>
              {errors.submit.includes("confirm your email") && (
                <Button
                  type="button"
                  onClick={handleResendConfirmation}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isResending}
                >
                  {isResending ? "Sending..." : "Resend Confirmation Email"}
                </Button>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>

          <div className="text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}