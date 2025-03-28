import React, { useState } from "react";
import style from "./login.module.css";
const s = style;
import logo from "../../../assets/1.png";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    const adminName = "heer";
    const adminPass = "Tasawar007";

    if (name === adminName && pass === adminPass) {
      localStorage.setItem("isAuthenticated", "true"); // Save login state
      navigate("/admin"); // Redirect to admin page
    } else {
      alert("Invalid Credentials");
    }
  };

  return (
    <div className={s.container}>
      <div className={s.box}>
        <div className={s.logo}>
          <img src={logo} alt="" />
        </div>
        <div className={s.data}>
          <h1>Please Enter Id Pass to Login</h1>
          <div className={s.fields}>
            <h2>Enter ID:</h2>
            <input
              type="text"
              className={s.inputFields}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
            <h2>Enter Password:</h2>
            <input
              type="password"
              className={s.inputFields}
              value={pass}
              onChange={(e) => {
                setPass(e.target.value);
              }}
            />
          </div>
          <button className={s.button} onClick={handleLogin}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
