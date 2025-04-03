import React, { useState, useEffect } from "react";
import axios from "axios";
import style from "./nameofcup.module.css";
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
  const [winner, setWinner] = useState(null);
  const [secondWinner, setSecondWinner] = useState(null);
  const [allownumber, setAllowNumber] = useState(0);
  const [maxPigeons, setMaxPigeons] = useState(0);
  const [availableDates, setAvailableDates] = useState([]); // Change variable name

  useEffect(() => {
    fetchNews();
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchParticipants(selectedTournament);
      const tournament = tournaments.find((t) => t._id === selectedTournament);
      setMaxPigeons(tournament?.pigeons || 0);
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
      const pinnedTournament = res.data.find((tournament) => tournament.pinned);
      if (pinnedTournament) {
        setSelectedTournament(pinnedTournament._id);
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
  const calculateWinnerAndSort = () => {
    if (participants.length === 0) return;

    const tournament = tournaments.find((t) => t._id === selectedTournament);
    if (!tournament) return;

    const allowedPigeons = tournament.pigeons || 0;
    setAllowNumber(allowedPigeons);

    let maxFlightTime = 0;
    let secondWinnerParticipant = null;

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
        });
      });

      // Process each day's flight data
      Object.entries(groupedFlights).forEach(([date, flightsPerDay]) => {
        // Sort flights by pigeonNumber
        flightsPerDay.sort((a, b) => a.pigeonNumber - b.pigeonNumber);

        // Take only up to allowed pigeons
        const validFlights = flightsPerDay.slice(0, allowedPigeons);

        // Find the highest single pigeon flight time for second winner selection
        validFlights.forEach((flight) => {
          if (flight.time > maxFlightTime) {
            maxFlightTime = flight.time;
            secondWinnerParticipant = participant;
          }
        });

        // Check if a lofted pigeon exists
        const loftedExists = validFlights.some((flight) => flight.lofted);

        // First pigeon’s time
        const firstPigeonTime =
          validFlights.length > 0 ? validFlights[0].time : 0;

        // Compute total flight time
        let dailyTotal = validFlights.reduce(
          (sum, flight) => sum + flight.time,
          0
        );

        // 🚀 **FIX:** Only subtract first pigeon’s time if we have data for all allowed pigeons.
        if (
          !loftedExists &&
          firstPigeonTime > 0 &&
          validFlights.length === allowedPigeons
        ) {
          dailyTotal -= firstPigeonTime;
        }

        // Ensure non-negative time
        dailyFlightTimes[date] = Math.max(dailyTotal, 0);
        totalFlightTime += dailyFlightTimes[date];
      });

      return { ...participant, totalFlightTime, dailyFlightTimes, flights };
    });

    // Sort participants by total flight time (highest first)
    const sorted = participantsWithTotalTime.sort(
      (a, b) => b.totalFlightTime - a.totalFlightTime
    );

    // ✅ **Second winner is now the participant whose any pigeon has the highest flight time**
    setSortedParticipants(sorted);
    setSecondWinner(secondWinnerParticipant);

    // Fetch and log first pigeon times (for debugging)
    const firstPigeonTimes = getFirstPigeonFlightTimes();
    console.log(firstPigeonTimes);
  };
  const getFirstPigeonFlightTimes = () => {
    let firstPigeonTimes = {};

    participants.forEach((participant) => {
      const flights = flightData[participant._id] || [];

      if (flights.length === 0) {
        firstPigeonTimes[participant._id] = {}; // No flights for this participant
        return;
      }

      // Group flights by date
      const groupedFlights = {};
      flights.forEach((flight) => {
        const dateKey = new Date(flight.date).toISOString().split("T")[0];
        if (!groupedFlights[dateKey]) groupedFlights[dateKey] = [];
        groupedFlights[dateKey].push(flight);
      });

      // Initialize first pigeon time for this participant
      firstPigeonTimes[participant._id] = {};

      Object.entries(groupedFlights).forEach(([date, flightsPerDay]) => {
        // Sort flights by pigeon number
        flightsPerDay.sort((a, b) => a.pigeonNumber - b.pigeonNumber);

        // Get the first pigeon's flight time
        if (flightsPerDay.length > 0) {
          firstPigeonTimes[participant._id][date] =
            parseFloat(flightsPerDay[0].flightTime) || 0;
        } else {
          firstPigeonTimes[participant._id][date] = null;
        }
      });
    });

    return firstPigeonTimes;
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return "N/A";
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

  return (
    <div className={s.container}>
      <div className={s.controls}>
        <div className={s.selecting}>
          <h2>Select Tournament:</h2>
          <select
            value={selectedTournament}
            onChange={(e) => {
              setSelectedTournament(e.target.value);
              setSelectedDate("");
              setParticipants([]);
              setFlightData({});
              setWinner(null);
              setSortedParticipants([]);
            }}
          >
            <option value="">-- Select --</option>
            {tournaments.map((tournament) => (
              <option key={tournament._id} value={tournament._id}>
                {tournament.name}
              </option>
            ))}
          </select>

          {selectedTournament && (
            <>
              <h2>Select Date:</h2>
              <div className={s.dateButtons}>
                {availableDates.length > 0 ? (
                  availableDates.map((dateStr) => (
                    <button
                      key={dateStr}
                      className={
                        selectedDate === dateStr ? s.activeButton : s.dateButton
                      }
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setWinner(null);
                      }}
                    >
                      {new Date(dateStr).toDateString()}
                    </button>
                  ))
                ) : (
                  <p>No recorded dates available</p>
                )}
                <button
                  className={
                    selectedDate === "total" ? s.activeButton : s.dateButton
                  }
                  onClick={() => {
                    setSelectedDate("total");
                    setWinner(
                      sortedParticipants.length > 0
                        ? sortedParticipants[0]
                        : null
                    );
                  }}
                >
                  Total
                </button>
              </div>
            </>
          )}
        </div>

        <div className={s.newsbox}>
          <h2>
            {news.map((item) => (
              <div key={item._id}>{item.text}</div>
            ))}
          </h2>
        </div>
      </div>

      {winner && selectedDate !== "total" && (
        <div className={s.winnerSection}>
          <div className={s.winner}>
            <h2>🏆 First Winner</h2>
            <p>
              Congratulations <strong>{winner.name}</strong> -{" "}
            </p>
          </div>

          {secondWinner && (
            <div className={s.secondWinner}>
              <h2>🥈 Last Winner</h2>
              <p>
                Congratulations <strong>{secondWinner.name}</strong> -{" "}
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
                  <th>Start Time</th>
                  {[...Array(maxPigeons).keys()].map((i) => (
                    <th key={i}>Pigeon {i + 1}</th>
                  ))}
                  <th>Flying Time ({selectedDate})</th>
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
                      <img
                        src={participant.imagePath}
                        alt={participant.name || "Unknown"}
                      />
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
                    : "N/A";

                return (
                  <tr key={participant._id}>
                    <td className={s.img}>
                      <img
                        src={participant.imagePath}
                        alt={participant.name || "Unknown"}
                      />
                    </td>
                    <td>{participant.name}</td>
                    <td>{startTime}</td>
                    {[...Array(maxPigeons).keys()].map((i) => (
                      <td key={i}>
                        {selectedFlights[i]?.lofted
                          ? "Lofted"
                          : selectedFlights[i]?.endTime || "N/A"}
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
