// The public form shares the app's face (Plus Jakarta Sans, from the root layout);
// .form-theme scopes the form's tokens.
export default function PublicFormLayout({ children }: { children: React.ReactNode }) {
    return <div className="form-theme form-app-bg">{children}</div>
}
