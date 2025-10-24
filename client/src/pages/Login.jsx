import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginUser, signupUser } from "../features/authSlice";
import { toast} from "react-hot-toast";

const Login = () => {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const passwordRef = useRef(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let data;

      if (mode === "login") {
        data = await dispatch(
          loginUser({ email: formData.email, password: formData.password })
        ).unwrap();
      } else {
        data = await dispatch(signupUser(formData)).unwrap();
      }

      const success = Boolean(data?.success || data?.user);
      const message =
        data?.message ||
        (success
          ? mode === "login"
            ? "Login Successful!"
            : "Signup Successful!"
          : "Something went wrong!");

      if (success) {
        toast.success(message);
        navigate('/');
      } else {
        toast.error(message);
      }
    } catch (error) {
      toast.error(error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-screen flex items-center justify-center p-4 bg-gray-50">
      {/* Toast container */}

      <div className="bg-white flex w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Image */}
        <div className="hidden md:block md:w-1/2">
          <img
            className="h-full w-full object-cover"
            src="login.png"
            alt="leftSideImage"
          />
        </div>

        {/* Form Section */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-12">
          <form
            className="w-full max-w-md flex flex-col items-center justify-center"
            onSubmit={handleSubmit}
          >
            <h2 className="text-3xl font-bold text-gray-900 self-start">
              {mode === "login" ? "Sign in" : "Sign up"}
            </h2>
            <p className="text-sm text-gray-500/90 mt-2 self-start">
              {mode === "login"
                ? "Welcome back! Please sign in to continue"
                : "Create your account to get started"}
            </p>

            {/* Signup-only fields */}
            {mode === "signup" && (
              <>
                <div className="flex items-center mt-4 w-full border border-gray-300/60 h-12 rounded-full px-4 gap-3 focus-within:border-indigo-500">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="bg-transparent text-gray-700 placeholder-gray-500/80 outline-none text-sm w-full h-full"
                    required
                  />
                </div>

                <div className="flex items-center mt-4 w-full border border-gray-300/60 h-12 rounded-full px-4 gap-3 focus-within:border-indigo-500">
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className="bg-transparent text-gray-700 placeholder-gray-500/80 outline-none text-sm w-full h-full"
                    required
                  />
                </div>
              </>
            )}

            {/* Email Input */}
            <div className="flex items-center mt-4 w-full border border-gray-300/60 h-12 rounded-full px-4 gap-3 focus-within:border-indigo-500">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email id"
                className="bg-transparent text-gray-700 placeholder-gray-500/80 outline-none text-sm w-full h-full"
                required
              />
            </div>

            {/* Password Input */}
            <div className="flex items-center mt-4 w-full border border-gray-300/60 h-12 rounded-full px-4 focus-within:border-indigo-500">
              <input
                ref={passwordRef}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="bg-transparent text-gray-700 placeholder-gray-500/80 outline-none text-sm w-full h-full"
                autoComplete="current-password"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="mt-8 w-full h-12 rounded-full text-white font-semibold bg-[#2B7FFF] flex items-center justify-center hover:bg-[#256DEB] transition-colors"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Login"
                : "Sign Up"}
            </button>

            {/* Switch mode link */}
            <p className="text-gray-500/90 text-sm mt-6">
              {mode === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <span
                className="text-indigo-500 font-semibold hover:underline cursor-pointer"
                onClick={() =>
                  setMode(mode === "login" ? "signup" : "login")
                }
              >
                {mode === "login" ? "Sign up" : "Login"}
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
