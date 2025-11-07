import { Navigate } from "react-router-dom";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";

const CustomerPrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useCustomerAuth();

  if (!isAuthenticated) {
    return <Navigate to="/customer-login" replace />;
  }

  return <>{children}</>;
};

export default CustomerPrivateRoute;
