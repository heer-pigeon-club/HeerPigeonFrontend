import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated"); // Get login status

  return isAuthenticated === "true" ? children : <Navigate to="/" />;
};

export default PrivateRoute;
