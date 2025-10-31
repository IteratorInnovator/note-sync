import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "../index.js";
import CriteriaItem from "../components/ui/CriteriaItem.jsx";
import EyeOff from "../assets/eye-off.svg";
import EyeShow from "../assets/eye-show.svg";

const ResetPasswordPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setConfirmPassword] = useState(false);
  const togglePassword = () => {
      setShowPassword(!showPassword);
  };
  const toggleConfirmPassword = () => {
      setConfirmPassword(!showConfirmPassword);
  };
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const oobCode = searchParams.get("oobCode");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const [passwordCriteria, setPasswordCriteria] = useState({
      minLength: false,
      uppercase: false,
      lowercase: false,
      number: false,
      match: false,
  });

  // Update criteria when password changes
  useEffect(() => {
    setPasswordCriteria({
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      match: confirm.length > 0 && password === confirm,
    });
  }, [password, confirm]);

  const handleReset = async (event) => {
    event.preventDefault();

    try {
      await confirmPasswordReset(auth, oobCode, password);
      alert("Password successfully reset! Redirecting to login...");
      setError("");
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      setError("Invalid or expired link. Please request another reset email.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleReset}
        className="bg-white p-6 rounded-2xl shadow-md w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-bold">Set New Password</h1>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-sm w-full rounded-xl border border-gray-200 py-2 pl-3 pr-10
                   focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
              type="button"
              onClick={togglePassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 grid place-items-center"
          >
          <img
              src={!showPassword ? EyeOff : EyeShow}
              className="h-4 w-4 text-slate-500"
              alt=""
          />
          </button>
        </div>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="text-sm w-full rounded-xl border border-gray-200 py-2 pl-3 pr-10
                   focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
              type="button"
              onClick={toggleConfirmPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 grid place-items-center"
          >
              <img
                  src={!showConfirmPassword ? EyeOff : EyeShow}
                  className="h-4 w-4 text-slate-500"
                  alt=""
              />
          </button>
        </div>

        {/* Criteria */}
        {password && (
          <div className="border border-slate-200 p-3 rounded-lg space-y-1">
            <p className="text-sm font-medium">Password must contain:</p>
            <CriteriaItem satisfied={passwordCriteria.minLength}>At least 8 characters</CriteriaItem>
            <CriteriaItem satisfied={passwordCriteria.uppercase}>One uppercase letter</CriteriaItem>
            <CriteriaItem satisfied={passwordCriteria.lowercase}>One lowercase letter</CriteriaItem>
            <CriteriaItem satisfied={passwordCriteria.number}>One number</CriteriaItem>
            {confirm && (  // Only show when user starts typing in confirm field
              <CriteriaItem satisfied={passwordCriteria.match}>Passwords match</CriteriaItem>
            )}
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <input
            type="submit"
            value="Reset Password"
            disabled={
                !Object.values(passwordCriteria).every(Boolean) ||
                !password ||
                !confirm
            }
            className="text-sm text-center px-6 py-2.5 mt-2 rounded-xl bg-red-500 text-white font-semibold w-full enabled:cursor-pointer enabled:hover:scale-105 transition-transform duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-50"
        />
      </form>
    </div>
  );
};

export default ResetPasswordPage;
