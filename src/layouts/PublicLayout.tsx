// src/layouts/PublicLayout.tsx
import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <html lang="en" className="dark">  {/* ← Yeh line force karegi dark theme */}
      <body className="min-h-screen bg-background text-foreground">
        <Outlet />  {/* ← Yahan SignIn, SignUp, ResetPassword etc. render honge */}
      </body>
    </html>
  );
};

export default PublicLayout;