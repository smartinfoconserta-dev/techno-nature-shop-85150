import { useState } from "react";
import { Customer } from "@/lib/customersStore";

interface CustomerAuthState {
  isAuthenticated: boolean;
  customer: Customer | null;
}

const getInitialAuthState = (): CustomerAuthState => {
  try {
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
  } catch (e) {
    console.error("Erro ao acessar localStorage:", e);
    return { isAuthenticated: false, customer: null };
  }
};

export const useCustomerAuth = () => {
  const [authState, setAuthState] = useState<CustomerAuthState>(getInitialAuthState());

  const login = (customer: Customer): void => {
    try {
      localStorage.setItem("customer_session", JSON.stringify(customer));
      setAuthState({
        isAuthenticated: true,
        customer,
      });
    } catch (e) {
      console.error("Erro ao salvar sessão:", e);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("customer_session");
      setAuthState({
        isAuthenticated: false,
        customer: null,
      });
    } catch (e) {
      console.error("Erro ao remover sessão:", e);
    }
  };

  return { ...authState, login, logout };
};
