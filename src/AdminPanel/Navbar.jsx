import React, { useEffect } from "react";
import style from "./admin.module.css";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const Navbar = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Load Google Translate script dynamically
    const addScript = document.createElement("script");
    addScript.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    addScript.async = true;
    document.body.appendChild(addScript);

    // Initialize Google Translate
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element"
      );
    };

    setTimeout(() => {
      // Hide Google Translate UI elements
      const iframe = document.querySelector(".goog-te-banner-frame");
      if (iframe) iframe.style.display = "none";

      const translateBox = document.querySelector(".goog-te-gadget");
      if (translateBox) translateBox.style.display = "none";

      const extraDivs = document.querySelectorAll("iframe, .skiptranslate");
      extraDivs.forEach((div) => (div.style.display = "none"));
    }, 2000);
  }, []);

  // Function to change language
  const changeLanguage = (lang) => {
    if (lang === "en") {
      // Reset translation by removing cookies
      document.cookie =
        "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" +
        window.location.hostname +
        "; path=/;";

      window.location.reload(); // Reload to reset translation
    } else if (lang === "ur") {
      // Apply translation manually using Google Translate dropdown
      const select = document.querySelector(".goog-te-combo");
      if (select) {
        select.value = "ur";
        select.dispatchEvent(new Event("change"));
      }
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("isAuthenticated"); // Clear login state
    navigate("/"); // Redirect to login page
  };

  return (
    <div className={style.container}>
      <div className={style.logo}>
        <NavLink to="/">
          <img src={logo} alt="Logo" />
        </NavLink>
      </div>
      <div className={style.navbar}>
        <NavLink className={style.buttons} to="/admin">
          Admin panel
        </NavLink>
        <button className={style.buttons} onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
      <div className={style.language}>
        <button onClick={() => changeLanguage("ur")}>Urdu</button>
        <button onClick={() => changeLanguage("en")}>English</button>
      </div>
      {/* Hidden Google Translate Widget */}
      <div id="google_translate_element" style={{ display: "none" }}></div>
    </div>
  );
};

export default Navbar;
