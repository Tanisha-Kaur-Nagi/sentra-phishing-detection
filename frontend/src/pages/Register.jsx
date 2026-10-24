import { useNavigate, Link } from "react-router-dom";
import AuthLayout, { Field } from "../components/AuthLayout";

export default function Register() {
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    navigate("/app/scan");
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start scanning URLs and files for free."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-[var(--color-brand)] hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Field label="Full name" type="text" placeholder="Tanisha Kaur" required />
        <Field label="Email" type="email" placeholder="you@example.com" required />
        <Field label="Password" type="password" placeholder="At least 8 characters" required minLength={8} />
        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-[var(--color-brand)] py-2.5 text-sm font-medium text-white hover:bg-[var(--color-brand-dim)]"
        >
          Create account
        </button>
      </form>
    </AuthLayout>
  );
}