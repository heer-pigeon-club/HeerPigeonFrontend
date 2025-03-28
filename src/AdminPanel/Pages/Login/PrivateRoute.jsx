import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated"); 

  return isAuthenticated === "true" ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
