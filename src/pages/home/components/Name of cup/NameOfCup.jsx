import React, { useState, useEffect } from "react";
import axios from "axios";
import style from "./nameofcup.module.css";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import Navbar from "../NavBar/Navbar";
const s = style;
const API_BASE_URL = import.meta.env.VITE_API_URL;
const NameOfCup = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [participants, setParticipants] = useState([]);
  const [flightData, setFlightData] = useState({});
  const [news, setNews] = useState([]);
  const [sortedParticipants, setSortedParticipants] = useState([]);
  const [firstWinner, setFirstWinner] = useState(null); // First Winner
  const [lastWinner, setLastWinner] = useState(null); // Last Winner
  const [allownumber, setAllowNumber] = useState(0);
  const [maxPigeons, setMaxPigeons] = useState(0);
  const [availableDates, setAvailableDates] = useState([]); // Change variable name
  const [pigeonStats, setPigeonStats] = useState({
    total: 0,
    lofted: 0,
    remaining: 0,
  });
  const navigate = useNavigate();
  const { id } = useParams();
  useEffect(() => {
    fetchNews();
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchParticipants(selectedTournament);
      const tournament = tournaments.find((t) => t._id === selectedTournament);
      setMaxPigeons(tournament?.pigeons || 0);
      calculatePigeonStats(selectedTournament);
    }
  }, [selectedTournament, tournaments]);

  useEffect(() => {
    if (selectedTournament && participants.length > 0) {
      participants.forEach((participant) => fetchFlightData(participant._id));
    }
  }, [selectedTournament, participants]);

  useEffect(() => {
    calculateWinnerAndSort();
  }, [flightData, participants]);

  const fetchNews = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/news`);
      setNews(res.data.filter((item) => item.published));
    } catch (err) {
      console.error("Error fetching news", err);
    }
  };

  const fetchTournaments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tournaments`);
      setTournaments(res.data);

      if (res.data.length > 0) {
        // Check if an ID is provided in the URL
        if (id) {
          const tournamentExists = res.data.find((t) => t._id === id);
          if (tournamentExists) {
            setSelectedTournament(id); // Select the tournament from the URL
          } else {
            console.warn(
              "Tournament ID from URL not found, selecting latest tournament"
            );
            setSelectedTournament(res.data[res.data.length - 1]._id); // Fallback to the latest tournament
          }
        } else {
          // No ID in the URL, select the latest tournament
          setSelectedTournament(res.data[res.data.length - 1]._id);
        }
      } else {
        console.warn("No tournaments available");
      }
    } catch (err) {
      console.error("Error fetching tournaments", err);
    }
  };

  const fetchParticipants = async (tournamentId) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/tournaments/${tournamentId}/participants`
      );
      setParticipants(res.data);
    } catch (err) {
      console.error("Error fetching participants", err);
    }
  };

  const fetchFlightData = async (participantId) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/participants/${participantId}/flights`
      );

      if (res.data.flightData) {
        setFlightData((prevData) => ({
          ...prevData,
          [participantId]: res.data.flightData,
        }));
      }
    } catch (err) {
      console.error("Error fetching flight data", err);
    }
  };
  const calculateWinnersPerDate = (selectedDate) => {
    if (participants.length === 0) return;

    const tournament = tournaments.find((t) => t._id === selectedTournament);
    if (!tournament) return;

    const allowedPigeons = tournament.pigeons || 0;
    setAllowNumber(allowedPigeons); // Set the allowed number of pigeons
    let firstWinner = null;
    let firstWinnerFlightTime = 0;
    let firstPigeonEndTime = null; // For storing the first pigeon's end time

    let lastWinner = null;
    let lastWinnerFlightTime = 0; // Highest flight time of any pigeon
    let lastWinnerEndTime = null; // For storing the last pigeon's end time

    participants.forEach((participant) => {
      const flights = flightData[participant._id] || [];

      // Filter flights for the selected date
      const flightsOnDate = flights.filter((flight) => {
        const flightDate = new Date(flight.date).toISOString().split("T")[0];
        return flightDate === selectedDate;
      });

      if (flightsOnDate.length === 0) return;

      // Sort flights by pigeonNumber (first pigeon first)
      flightsOnDate.sort((a, b) => a.pigeonNumber - b.pigeonNumber);

      // First Winner: First pigeon's flight time and end time
      if (flightsOnDate.length > 0) {
        const firstPigeon = flightsOnDate[0];
        const firstPigeonTime = parseFloat(firstPigeon.flightTime) || 0;

        // Fetch end time for the first pigeon (if available)
        const firstPigeonEndTimeFetched = firstPigeon.endTime || null;

        if (firstPigeonTime > firstWinnerFlightTime) {
          firstWinnerFlightTime = firstPigeonTime;
          firstWinner = participant;
          firstPigeonEndTime = firstPigeonEndTimeFetched; // Store the end time
        }
      }

      // Last Winner: Any pigeon's flight time (highest time) and end time
      flightsOnDate.forEach((flight) => {
        const pigeonTime = parseFloat(flight.flightTime) || 0;

        // Fetch end time for this pigeon (if available)
        const pigeonEndTimeFetched = flight.endTime || null;

        if (pigeonTime > lastWinnerFlightTime) {
          lastWinnerFlightTime = pigeonTime;
          lastWinner = participant;
          lastWinnerEndTime = pigeonEndTimeFetched; // Store the end time
        }
      });
    });

    // Set the winners with their respective names and end times
    setFirstWinner({ ...firstWinner, firstPigeonEndTime });
    setLastWinner({ ...lastWinner, lastWinnerEndTime });
  };
  const calculateWinnerAndSort = (selectedDate) => {
    if (participants.length === 0) return;

    const tournament = tournaments.find((t) => t._id === selectedTournament);
    if (!tournament) return;

    const allowedPigeons = tournament.pigeons || 0;

    const participantsWithTotalTime = participants.map((participant) => {
      const flights = flightData[participant._id] || [];
      let totalFlightTime = 0;
      let dailyFlightTimes = {}; // Store daily flight times for UI

      // Group flights by date
      const groupedFlights = {};
      flights.forEach((flight) => {
        const dateKey = new Date(flight.date).toISOString().split("T")[0];
        if (!groupedFlights[dateKey]) groupedFlights[dateKey] = [];
        groupedFlights[dateKey].push({
          time: parseFloat(flight.flightTime) || 0,
          lofted: flight.lofted || false,
          pigeonNumber: flight.pigeonNumber,
          endTime: flight.endTime, // Ensure endTime is included here
        });
      });

      // Process each day's flight data
      Object.entries(groupedFlights).forEach(([date, flightsPerDay]) => {
        flightsPerDay.sort((a, b) => a.pigeonNumber - b.pigeonNumber);

        // Take only up to allowed pigeons
        const validFlights = flightsPerDay.slice(0, allowedPigeons);

        // Calculate daily total time excluding lofted pigeons
        let dailyTotal = validFlights.reduce((sum, flight) => {
          return flight.lofted ? sum : sum + flight.time;
        }, 0);

        dailyFlightTimes[date] = Math.max(dailyTotal, 0);
        totalFlightTime += dailyFlightTimes[date];
      });

      return { ...participant, totalFlightTime, dailyFlightTimes, flights };
    });

    // Sort participants based on their total flight time (descending)
    const sorted = participantsWithTotalTime.sort(
      (a, b) => b.totalFlightTime - a.totalFlightTime
    );

    // Update state with sorted participants
    setSortedParticipants(sorted);

    // Check if all participants' data is added and calculate winners
    if (sorted.length === participants.length) {
      calculateWinnersPerDate(selectedDate); // Calculate and set winners based on the date
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return "";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}: ${minutes}: ${secs}`;
  };

  useEffect(() => {
    if (!participants.length) return;

    const uniqueDates = new Set();
    participants.forEach((participant) => {
      if (flightData[participant._id]) {
        flightData[participant._id].forEach((flight) => {
          uniqueDates.add(new Date(flight.date).toISOString().split("T")[0]);
        });
      }
    });

    const sortedDates = Array.from(uniqueDates).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    setAvailableDates(sortedDates); // Make sure this variable is correctly set

    if (!selectedDate) {
      setSelectedDate("total");
    }
  }, [participants, flightData]);

  const calculatePigeonStats = async (tournamentId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/tournaments/${tournamentId}/participants`
      );

      const participants = response.data;
      let totalPigeons = 0;
      let loftedPigeons = 0;

      // Fetch flight data for each participant to calculate lofted pigeons
      for (const participant of participants) {
        const flightResponse = await axios.get(
          `${API_BASE_URL}/api/participants/${participant._id}/flights`
        );

        const flights = flightResponse.data.flightData || [];

        totalPigeons += participant.pigeons.length;

        // Count lofted pigeons based on flight data
        flights.forEach((flight) => {
          if (flight.lofted) {
            loftedPigeons++;
          }
        });
      }

      const remainingPigeons = totalPigeons - loftedPigeons;

      setPigeonStats({
        total: totalPigeons,
        lofted: loftedPigeons,
        remaining: remainingPigeons,
      });
    } catch (error) {
      console.error("Error calculating pigeon stats:", error);
    }
  };

  return (
    <div className={s.container}>
      <div className={s.controls}>
        <div className={s.routing}>
          <NavLink className={s.navBtn}>Home</NavLink>

          <NavLink className={s.navBtn} to="/tournament">
            Other
          </NavLink>
          <NavLink className={s.navBtn} to="/weather">
            Weather
          </NavLink>
          <NavLink className={s.navBtn} to="/contact">
            Contact
          </NavLink>
        </div>
        <div className={s.selecting}>
          <div className={s.tournamentButtons}>
            {tournaments.length > 0 ? (
              tournaments.map((tournament) => (
                <button
                  key={tournament._id}
                  className={
                    selectedTournament === tournament._id
                      ? s.activeButton
                      : s.tournamentButton // or create a new `tournamentButton` style if needed
                  }
                  onClick={() => {
                    setSelectedTournament(tournament._id);
                    setSelectedDate("total");
                    setParticipants([]);
                    setFlightData({});
                    setFirstWinner(null);
                    setLastWinner(null);
                    setSortedParticipants([]);
                    navigate(`/${tournament._id}`);
                  }}
                >
                  {tournament.name}
                </button>
              ))
            ) : (
              <p>No tournaments available</p>
            )}
          </div>
        </div>
      </div>
      <div className={s.newsbox}>
        <p>
          {news.map((item) => (
            <span key={item._id} className={s.marqueeText}>
              {item.text} &nbsp;&nbsp; {/* Space between items */}
            </span>
          ))}
        </p>
      </div>

      <div className={s.tournamentBox}>
        {tournaments.map((tournament) => {
          if (tournament._id === selectedTournament) {
            return (
              <div key={tournament._id} className={s.selectedTournament}>
                <h4>{tournament.name}</h4>
                <p>Start Time: {tournament.startTime}</p>
              </div>
            );
          }
          return null;
        })}
      </div>
      <div className={s.dateBox}>
        {selectedTournament && (
          <>
            <div className={s.dateButtons}>
              {availableDates.length > 0 ? (
                availableDates.map((dateStr) => (
                  <button
                    key={dateStr}
                    className={
                      selectedDate === dateStr ? s.activeButtons : s.dateButtons
                    }
                    onClick={() => {
                      setSelectedDate(dateStr);
                      calculateWinnersPerDate(dateStr);
                    }}
                  >
                    {new Date(dateStr).toDateString()}
                  </button>
                ))
              ) : (
                <p></p>
              )}
              <button
                className={
                  selectedDate === "total" ? s.activeButtons : s.dateButtons
                }
                onClick={() => {
                  setSelectedDate("total");
                }}
              >
                Total
              </button>
            </div>
          </>
        )}
      </div>
      <div className={s.status}>
        <p>Total Pigeons: {pigeonStats.total}</p>
        <p>Lofted Pigeons: {pigeonStats.lofted}</p>
        <p>Remaining Pigeons: {pigeonStats.remaining}</p>
      </div>
      {selectedDate && selectedDate !== "total" && (
        <div className={s.winnerSection}>
          {firstWinner && (
            <div className={s.firstWinnerSection}>
              <h5>🏆 First Winner</h5>
              <p>
                {firstWinner.name} :
                {firstWinner.firstPigeonEndTime
                  ? firstWinner.firstPigeonEndTime.toLocaleString()
                  : "Not available"}{" "}
              </p>
            </div>
          )}

          {lastWinner && (
            <div className={s.LastWinnerSection}>
              <h5>🥈 Last Winner</h5>
              <p>
                {lastWinner.name} :
                {lastWinner.lastWinnerEndTime
                  ? lastWinner.lastWinnerEndTime.toLocaleString()
                  : "Not available"}
              </p>
            </div>
          )}
        </div>
      )}
      <div className={s.participant}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Picture</th>
              <th>Name</th>
              {selectedDate === "total" ? (
                <>
                  <th>Total Pigeons</th>
                  {availableDates.map((date) => (
                    <th key={date}>{date}</th>
                  ))}
                  <th>Total Time</th>
                </>
              ) : (
                <>
                  {/* <th>Start Time</th> */}
                  {[...Array(maxPigeons).keys()].map((i) => (
                    <th key={i}>Pigeon {i + 1}</th>
                  ))}
                  <th>Total </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedParticipants.map((participant) => {
              const {
                flights = [],
                dailyFlightTimes = {},
                totalFlightTime,
              } = participant;

              if (selectedDate === "total") {
                return (
                  <tr key={participant._id}>
                    <td className={s.img}>
                      <img src={participant.imagePath || ""} />
                    </td>
                    <td>{participant.name}</td>
                    <td>{allownumber}</td>
                    {availableDates.map((date) => (
                      <td key={date}>
                        {formatTime(dailyFlightTimes[date] || 0)}
                      </td>
                    ))}
                    <td>{formatTime(totalFlightTime)}</td>
                  </tr>
                );
              } else {
                // Flights filtered by selected date
                const selectedFlights = flights.filter(
                  (f) =>
                    new Date(f.date).toISOString().split("T")[0] ===
                    selectedDate
                );

                const startTime =
                  selectedFlights.length > 0
                    ? new Date(
                        `1970-01-01T${selectedFlights[0]?.startTime}`
                      ).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                    : "";

                return (
                  <tr key={participant._id} className={s.row}>
                    <td className={s.img}>
                      <img src={participant.imagePath || ""} />
                    </td>
                    <td>{participant.name}</td>
                    {/* <td>{startTime}</td> */}
                    {[...Array(maxPigeons).keys()].map((i) => (
                      <td key={i}>
                        {selectedFlights[i]?.lofted
                          ? "Lofted"
                          : selectedFlights[i]?.endTime || ""}
                      </td>
                    ))}
                    <td>{formatTime(dailyFlightTimes[selectedDate] || 0)}</td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NameOfCup;
