import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./Tournament.module.css";
const API_BASE_URL = import.meta.env.VITE_API_URL;
const Tournament = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchTournaments();
  }, []);
  const fetchTournaments = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/tournaments`);
    setData(response.data);
  };
  return (
    <div className={styles.table}>
      <table className={styles.tournamentTable}>
        <thead>
          <tr>
            <th>#</th>
            <th>Tournament</th>
            <th>Start Date</th>
            <th>End Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((tournament, index) => (
            <tr key={tournament._id}>
              <td>{index + 1}</td>
              <td>{tournament.name}</td>
              <td>{tournament.startDate}</td>
              <td>{tournament.endDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Tournament;
