// src/context/AuthContext.jsx

import {
    createContext,
    useContext,
    useState,
    useEffect,
} from "react";

import { gql } from "@apollo/client";
import { authClient } from "../clients/apolloClients.jsx";

const AuthContext = createContext();

const LOGIN_MUTATION = gql`
  mutation Mutation($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $password: String!, $name: String!) {
    register(email: $email, password: $password, name: $name) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load auth data
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
        }

        setLoading(false);
    }, []);

    // Login
    const login = async (email, password) => {
        try {
            setLoading(true);

            const { data } = await authClient.mutate({
                mutation: LOGIN_MUTATION,
                variables: {
                    email,
                    password,
                },
            });

            const loginData = data.login;

            // Save state
            setUser(loginData.user);
            setToken(loginData.token);

            // Save localStorage
            localStorage.setItem(
                "user",
                JSON.stringify(loginData.user)
            );

            localStorage.setItem(
                "token",
                loginData.token
            );

            return loginData;

        } catch (error) {
            console.error("Login failed:", error);
            throw error;

        } finally {
            setLoading(false);
        }
    };

    const register = async (email, password, name) => {
        try {
            setLoading(true);

            const { data } = await authClient.mutate({
                mutation: REGISTER_MUTATION,
                variables: {
                    email,
                    password,
                    name,
                },
            });

            const registerData = data.register;

            // Save state
            setUser(registerData.user);
            setToken(registerData.token);

            // Save localStorage
            localStorage.setItem(
                "user",
                JSON.stringify(registerData.user)
            );

            localStorage.setItem(
                "token",
                registerData.token
            );

            return registerData;

        } catch (error) {
            console.error("Registration failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Logout
    const logout = () => {
        setUser(null);
        setToken(null);

        localStorage.removeItem("user");
        localStorage.removeItem("token");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                register,
                logout,
                isAuthenticated: !!token,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook
export function useAuth() {
    return useContext(AuthContext);
}