import React from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import '../App.css';

interface ForgotPasswordFormValues {
  email: string;
}

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required')
});

export default function ForgotPasswordPage(): JSX.Element {
  const formik = useFormik<ForgotPasswordFormValues>({
    initialValues: { 
      email: '' 
    },
    validationSchema,
    onSubmit: (values: ForgotPasswordFormValues) => {
      console.log('Forgot password values:', values);
      // Add your forgot password logic here
      // Example: await forgotPasswordAPI(values.email);
    }
  });

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-left">
          <h2>WELCOME!</h2>
          <p>Hope, You and your Family have a Great Day</p>
        </div>
        <div className="auth-right">
          <h2>Forgot Password</h2>
          <form className="auth-form" onSubmit={formik.handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
              aria-invalid={formik.touched.email && formik.errors.email ? 'true' : 'false'}
              aria-describedby={formik.touched.email && formik.errors.email ? 'email-error' : undefined}
            />
            {formik.touched.email && formik.errors.email ? (
              <div 
                id="email-error"
                className="error-text"
                role="alert"
              >
                {formik.errors.email}
              </div>
            ) : null}

            <button 
              type="submit" 
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          <div className="auth-footer">
            <Link to="/">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}