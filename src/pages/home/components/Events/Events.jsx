import React, { useState, useEffect, useRef } from "react";
import style from "./events.module.css";
import axios from "axios";

const s = style;
const API_BASE_URL = import.meta.env.VITE_API_URL;
const Events = () => {
  const [posts, setPosts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Fetch posts from backend
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/posts`)
      .then((res) => setPosts(res.data))
      .catch((err) => console.log(err));
  }, []);

  // Handle touch start
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  // Handle touch move
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  // Handle touch end (determine swipe direction)
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const difference = touchStartX.current - touchEndX.current;

    if (difference > 50) {
      // Swipe left → next image
      setCurrentIndex((prevIndex) =>
        prevIndex === posts.length - 1 ? 0 : prevIndex + 1
      );
    } else if (difference < -50) {
      // Swipe right → previous image
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? posts.length - 1 : prevIndex - 1
      );
    }

    // Reset values after swipe
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Automatic sliding every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === posts.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); // Slide every 3 seconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [posts]);

  return (
    <div className={s.container}>
      {posts.length > 0 && (
        <div
          className={s.carousel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Left Arrow */}
          <button
            className={s.arrowLeft}
            onClick={() =>
              setCurrentIndex((prevIndex) =>
                prevIndex === 0 ? posts.length - 1 : prevIndex - 1
              )
            }
          >
            &#8592;
          </button>

          {/* Image Slide */}
          <div className={s.slide}>
            <img
              src={posts[currentIndex].imageUrl}
              alt={posts[currentIndex].name}
              className={s.eventImage}
            />
          </div>

          {/* Right Arrow */}
          <button
            className={s.arrowRight}
            onClick={() =>
              setCurrentIndex((prevIndex) =>
                prevIndex === posts.length - 1 ? 0 : prevIndex + 1
              )
            }
          >
            &#8594;
          </button>
        </div>
      )}
    </div>
  );
};

export default Events;
