import { useState } from "react";
import { Customer } from "@/lib/customersStore";

interface CustomerAuthState {
  isAuthenticated: boolean;
  customer: Customer | null;
}

const getInitialAuthState = (): CustomerAuthState => {
  const customerData = localStorage.getItem("customer_session");
  
  if (customerData) {
    try {
      return {
        isAuthenticated: true,
        customer: JSON.parse(customerData),
      };
    } catch {
      return { isAuthenticated: false, customer: null };
    }
  }
  
  return { isAuthenticated: false, customer: null };
};

export const useCustomerAuth = () => {
  const [authState, setAuthState] = useState<CustomerAuthState>(getInitialAuthState());

  const login = (customer: Customer): void => {
    localStorage.setItem("customer_session", JSON.stringify(customer));
    setAuthState({
      isAuthenticated: true,
      customer,
    });
  };

  const logout = () => {
    localStorage.removeItem("customer_session");
    setAuthState({
      isAuthenticated: false,
      customer: null,
    });
  };

  return { ...authState, login, logout };
};
