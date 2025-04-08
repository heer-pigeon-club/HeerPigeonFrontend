import React, { useEffect } from "react";

const WindyMap = () => {
  useEffect(() => {
    const options = {
      key: "PsLAtXpsPTZexBwUkO7Mx5I", // Replace with your Windy API key
      verbose: true,
      lat: 50.4,
      lon: 14.3,
      zoom: 5,
    };

    // Initialize Windy API
    if (window.windyInit) {
      window.windyInit(options, (windyAPI) => {
        const { map } = windyAPI;

        // Add a popup to the map
        window.L.popup()
          .setLatLng([50.4, 14.3])
          .setContent("Hello World")
          .openOn(map);
      });
    } else {
      console.error("Windy API is not loaded.");
    }
  }, []);

  return (
    <div id="windy" style={{ width: "100%", height: "500px" }}>
      {/* Windy map will be rendered here */}
    </div>
  );
};

export default WindyMap;
