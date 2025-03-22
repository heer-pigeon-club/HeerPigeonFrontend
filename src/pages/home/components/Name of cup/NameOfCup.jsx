import React, { useState, useEffect } from "react";
import axios from "axios";
import style from "./nameofcup.module.css";
const s = style;

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
      const res = await axios.get("http://localhost:5001/api/news");
      setNews(res.data.filter((item) => item.published));
    } catch (err) {
      console.error("Error fetching news", err);
    }
  };

  const fetchTournaments = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/tournaments");
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
        `http://localhost:5001/api/tournaments/${tournamentId}/participants`
      );
      setParticipants(res.data);
    } catch (err) {
      console.error("Error fetching participants", err);
    }
  };

  const fetchFlightData = async (participantId) => {
    try {
      const res = await axios.get(
        `http://localhost:5001/api/participants/${participantId}/flights`
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

    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    const allowedPigeons = tournament.pigeons || 0;

    const participantsWithTotalTime = participants.map((participant) => {
      const flights = flightData[participant._id] || [];

      let totalFlightTime = 0;
      let loftedExists = false;
      let firstPigeonTimeOnFirstDate = null;
      let earliestDate = null;

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

      // Find the first recorded date
      const recordedDates = Object.keys(groupedFlights).sort();
      earliestDate = recordedDates.length > 0 ? recordedDates[0] : null;

      let totalDaysWithData = recordedDates.length;
      let tournamentDays = 0;
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        tournamentDays++;
      }

      let hasAllDaysData = totalDaysWithData >= tournamentDays;

      Object.entries(groupedFlights).forEach(([date, flightsPerDay]) => {
        flightsPerDay.sort((a, b) => a.pigeonNumber - b.pigeonNumber);
        const validFlights = flightsPerDay.slice(0, allowedPigeons);

        if (validFlights.some((flight) => flight.lofted)) {
          loftedExists = true;
        }

        if (date === earliestDate && validFlights.length > 0) {
          firstPigeonTimeOnFirstDate = validFlights[0].time;
        }

        validFlights.forEach((flight) => {
          totalFlightTime += flight.time;
        });
      });

      if (
        hasAllDaysData &&
        !loftedExists &&
        firstPigeonTimeOnFirstDate !== null
      ) {
        totalFlightTime -= firstPigeonTimeOnFirstDate;
        totalFlightTime = Math.max(totalFlightTime, 0);
      }

      return { ...participant, totalFlightTime, flights };
    });

    const sorted = participantsWithTotalTime.sort(
      (a, b) => b.totalFlightTime - a.totalFlightTime
    );

    setSortedParticipants(sorted);
    setWinner(sorted.length > 0 ? sorted[0] : null);
    setSecondWinner(sorted.length > 1 ? sorted[1] : null);
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}: ${minutes}: ${secs}`;
  };

  const getLastPigeonEndTime = (flights) => {
    if (!flights || flights.length === 0) return "N/A";

    // Group flights by date
    const groupedFlights = {};
    flights.forEach((flight) => {
      const dateKey = new Date(flight.date).toISOString().split("T")[0]; // Format YYYY-MM-DD
      if (!groupedFlights[dateKey]) groupedFlights[dateKey] = [];
      groupedFlights[dateKey].push(flight);
    });

    // Get the last recorded date
    const recordedDates = Object.keys(groupedFlights).sort(); // Sorting ensures last date is at the end
    const lastDate =
      recordedDates.length > 0 ? recordedDates[recordedDates.length - 1] : null;

    if (!lastDate) return "N/A";

    // Get the flights for the last recorded date
    const lastDateFlights = groupedFlights[lastDate];

    // Find the last pigeon end time on that date
    const lastPigeonFlight = lastDateFlights.reduce((latest, flight) => {
      return flight.endTime > (latest?.endTime || "00:00:00") ? flight : latest;
    }, null);

    return lastPigeonFlight?.endTime || "N/A";
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

      {winner && selectedDate === "total" && (
        <div className={s.winnerSection}>
          <div className={s.winner}>
            <h2>🏆 First Winner</h2>
            <p>
              <strong>{winner.name}</strong> -{" "}
              {getLastPigeonEndTime(winner.flights)}
            </p>
          </div>

          {secondWinner && (
            <div className={s.secondWinner}>
              <h2>🥈 Last Winner</h2>
              <p>
                <strong>{secondWinner.name}</strong> -{" "}
                {getLastPigeonEndTime(secondWinner.flights)}
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
                  <th>Flight Time ({selectedDate})</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedParticipants.map((participant) => {
              const flights = participant.flights || [];

              if (selectedDate === "total") {
                // Calculate total pigeons and total flight time per date
                const totalPigeons = new Set(
                  participant.flights
                    ?.filter((f) => f.flightTime) // Only count pigeons with recorded flight time
                    .map((f) => f.pigeonNumber)
                ).size;

                const dateFlightTimes = availableDates.reduce((acc, date) => {
                  acc[date] = flights
                    .filter(
                      (f) =>
                        new Date(f.date).toISOString().split("T")[0] === date
                    )
                    .reduce(
                      (sum, flight) =>
                        sum + (parseFloat(flight.flightTime) || 0),
                      0
                    );
                  return acc;
                }, {});
                const totalFlightTime = flights.reduce(
                  (sum, flight) => sum + (parseFloat(flight.flightTime) || 0),
                  0
                );

                return (
                  <tr key={participant._id}>
                    <td className={s.img}>
                      <img
                        src={participant.imagePath}
                        alt={participant.name || "Unknown"}
                      />
                    </td>
                    <td>{participant.name}</td>
                    <td>{totalPigeons}</td>
                    {availableDates.map((date) => (
                      <td key={date}>{formatTime(dateFlightTimes[date])}</td>
                    ))}
                    <td>{formatTime(totalFlightTime)}</td>
                  </tr>
                );
              } else {
                // Filter flights only for the selected date
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

                const totalFlightTime = selectedFlights.reduce(
                  (sum, flight) => sum + (parseFloat(flight.flightTime) || 0),
                  0
                );

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
                    <td>{formatTime(totalFlightTime)}</td>
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
