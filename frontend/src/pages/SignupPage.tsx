import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import Button from "../components/Button";
import { register, UserCreate, UserResponse, ApiError } from "../apis/api";

// TypeScript interfaces
interface SignupFormValues {
  full_name: string;
  username: string;
  email: string;
  password: string;
}

export default function SignupPage(): JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const navigate = useNavigate();

  const formik = useFormik<SignupFormValues>({
    initialValues: {
      full_name: "",
      username: "",
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      full_name: Yup.string()
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name must be less than 100 characters")
        .required("Full name is required"),
      username: Yup.string()
        .min(3, "Username must be at least 3 characters")
        .max(50, "Username must be less than 50 characters")
        .matches(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
        .required("Username is required"),
      email: Yup.string()
        .email("Invalid email format")
        .required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .max(100, "Password must be less than 100 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number")
        .required("Password is required"),
    }),
    onSubmit: async (values: SignupFormValues) => {
      setIsLoading(true);
      setApiError("");
      setSuccessMessage("");

      try {
        const userData: UserCreate = {
          username: values.username,
          email: values.email,
          password: values.password,
          full_name: values.full_name,
        };

        const response: UserResponse = await register(userData);
        setSuccessMessage(`Account created successfully! Welcome, ${response.full_name || response.username}!`);
        
        // Clear form
        formik.resetForm();
        
        // Redirect to login page after successful signup
        setTimeout(() => {
          navigate("/login", { 
            state: { 
              message: "Account created successfully! Please login to continue." 
            } 
          });
        }, 2000);
      } catch (error) {
        console.error("Registration error:", error);
        
        if (error && typeof error === 'object' && 'detail' in error) {
          const apiError = error as ApiError;
          setApiError(apiError.detail);
        } else if (error instanceof Error) {
          setApiError(error.message);
        } else {
          setApiError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col md:flex-row">
        {/* Left Side - Welcome Section */}
        <div className="md:w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-green-800 p-8 flex flex-col justify-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-12 -translate-y-12"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-12 translate-y-12"></div>
            <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-white rounded-full -translate-x-10 -translate-y-10"></div>
            <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-white rounded-full opacity-5"></div>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">WELCOME!</h2>
            <p className="text-lg text-green-100 mb-4">
              Hope, You and your Family have a Great Day
            </p>
            <div className="mt-8">
              <p className="text-green-200 text-sm">Already have an account?</p>
              <Link
                to="/login"
                className="text-white hover:text-green-100 font-medium transition-colors duration-200 bg-transparent border-none cursor-pointer"
              >
                Login
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="md:w-1/2 p-8 flex flex-col justify-center bg-white">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Sign Up
          </h2>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {apiError}
            </div>
          )}

          <div className="space-y-6">
          <form className="space-y-6" onSubmit={formik.handleSubmit}>
            <div>

              <input
                type="text"
                name="full_name"
                placeholder="Full Name"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.full_name}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg bg-white border-2 border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-green-50 disabled:opacity-50 transition-all duration-200"
              />
              {formik.touched.full_name && formik.errors.full_name ? (
                <div className="text-red-500 text-xs mt-1">
                  {formik.errors.full_name}
                </div>
              ) : null}
            </div>

            <div>
              <input
                type="text"
                name="username"
                placeholder="Username"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.username}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg bg-white border-2 border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-green-50 disabled:opacity-50 transition-all duration-200"
              />
              {formik.touched.username && formik.errors.username ? (
                <div className="text-red-500 text-xs mt-1">
                  {formik.errors.username}
                </div>
              ) : null}
            </div>

            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg bg-white border-2 border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-green-50 disabled:opacity-50 transition-all duration-200"
              />
              {formik.touched.email && formik.errors.email ? (
                <div className="text-red-500 text-xs mt-1">
                  {formik.errors.email}
                </div>
              ) : null}
            </div>

            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg bg-white border-2 border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-green-50 disabled:opacity-50 transition-all duration-200"
              />
              {formik.touched.password && formik.errors.password ? (
                <div className="text-red-500 text-xs mt-1">
                  {formik.errors.password}
                </div>
              ) : null}
            </div>

            <Button 
              type="submit" 
              fullWidth 
              disabled={isLoading || !formik.isValid}
            >
              {isLoading ? "Creating Account..." : "Register"}
            </Button>

            </form>
          </div>
          

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-xs">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );

}