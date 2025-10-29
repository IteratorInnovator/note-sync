import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { applyActionCode, signOut } from "firebase/auth";
import { auth } from "../index.js";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // "loading", "success", "error"
  const [error, setError] = useState("");
  const hasRun = useRef(false);

  const oobCode = searchParams.get("oobCode");

  useEffect(() => {
    if (hasRun.current || !oobCode) return;
    hasRun.current = true;

    const verifyEmail = async () => {
      try {
        await applyActionCode(auth, oobCode);
        await signOut(auth)
        setStatus("success");

        setTimeout(() => navigate("/"), 3000);
        return;

      } catch (err) {
        setStatus("error");
        console.log(err)
        if (err.code === "auth/invalid-action-code") {
          setError("This verification link is invalid or has already been used.");
        } else if (err.code === "auth/expired-action-code") {
          setError("This verification link has expired. Please request a new one.");
        } else {
          setError("Unable to verify email. Please try again.");
        }
      }
    };

    verifyEmail();
  }, [oobCode, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold">Verifying Email...</h1>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-green-600">Email Verified!</h1>
            <p className="text-gray-600">
              Your email has been successfully verified. Redirecting to login...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-red-600">Verification Failed</h1>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 px-6 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:scale-105 transition-transform duration-200"
            >
              Return to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;