import { AiFillPushpin, AiOutlinePushpin } from "react-icons/ai";
import { IoIosPeople } from "react-icons/io";
import { BiEdit } from "react-icons/bi";
import { AiOutlineUsergroupAdd } from "react-icons/ai";
import { IoAddCircleOutline } from "react-icons/io5";
import React, { useState, useEffect } from "react";
import axios from "axios";
import style from "./tournament.module.css";
import { FaMinusCircle } from "react-icons/fa";
const s = style;
import { NavLink } from "react-router-dom";
const API_BASE_URL = import.meta.env.VITE_API_URL;
const Tournament = () => {
  const [data, setData] = useState([]);
  const [tournament, addTournament] = useState(false);
  const [editTournament, setEditTournament] = useState(false);
  const [addPerson, setAddPerson] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [newTournament, setNewTournament] = useState({
    name: "",
    startDate: "",
    endDate: "",
    pigeons: "",
  });
  const [editData, setEditData] = useState({
    _id: "",
    name: "",
    startDate: "",
    endDate: "",
    pigeons: "",
  });
  const [newParticipant, setNewParticipant] = useState({
    name: "",
    address: "",
    image: null,
    pigeons: "", // Should be a string/number, not an array
  });
  const [pigeonStats, setPigeonStats] = useState({
    total: 0,
    lofted: 0,
    remaining: 0,
  });
  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    calculatePigeonStats();
  }, [data]);

  const fetchTournaments = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/tournaments`);
    setData(response.data);
  };

  const adding = () => addTournament(!tournament);
  const editing = (t) => {
    setEditData(t);
    setEditTournament(true);
  };
  const addingPerson = (tournamentId) => {
    setSelectedTournament(tournamentId);
    setAddPerson(true);
  };

  const handleAddTournament = async () => {
    await axios.post(`${API_BASE_URL}/api/tournaments`, newTournament);
    fetchTournaments();
    addTournament(false);
  };
  // const handlePinTournament = async (id) => {
  //   await axios.put(`${API_BASE_URL}/api/tournaments/${id}/pin`);
  //   fetchTournaments();
  // };

  const handleEditTournament = async () => {
    await axios.put(
      `${API_BASE_URL}/api/tournaments/${editData._id}`,
      editData
    );
    fetchTournaments();
    setEditTournament(false);
  };

  const removeItem = async (id) => {
    await axios.delete(`${API_BASE_URL}/api/tournaments/${id}`);
    fetchTournaments();
  };

  const handleAddParticipant = async () => {
    if (
      !newParticipant.name ||
      !newParticipant.pigeons // Should be a number
    ) {
      alert("Please fill all fields and upload an image");
      return;
    }

    const formData = new FormData();
    formData.append("name", newParticipant.name);
    formData.append("address", newParticipant.address);
    formData.append("image", newParticipant.image);
    formData.append("pigeons", newParticipant.pigeons); // Send as a number
    formData.append("tournamentId", selectedTournament);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/participants`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Participant added:", response.data);
      setAddPerson(false);
      setNewParticipant({ name: "", address: "", image: null, pigeons: "" });
    } catch (error) {
      console.error("Error adding participant:", error.response?.data || error);
      alert("Failed to add participant");
    }
  };
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setNewParticipant((prev) => ({ ...prev, image: e.target.files[0] }));
    }
  };

  const calculatePigeonStats = async () => {
    try {
      let totalPigeons = 0;
      let loftedPigeons = 0;

      // Loop through each tournament to fetch participants
      for (const tournament of data) {
        const response = await axios.get(
          `${API_BASE_URL}/api/tournaments/${tournament._id}/participants`
        );

        const participants = response.data;

        // Calculate total and lofted pigeons for each participant
        participants.forEach((participant) => {
          totalPigeons += participant.pigeons.length;

          participant.pigeons.forEach((pigeon) => {
            if (pigeon.lofted) {
              loftedPigeons++;
            }
          });
        });
      }

      // Calculate remaining pigeons
      const remainingPigeons = totalPigeons - loftedPigeons;

      // Update state with calculated stats
      setPigeonStats({
        total: totalPigeons,
        lofted: loftedPigeons,
        remaining: remainingPigeons,
      });
    } catch (error) {
      console.error("Error calculating pigeon stats:", error);
    }
  };

  const calculatePigeonStatsForTournament = async (tournamentId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/tournaments/${tournamentId}/participants`
      );

      const participants = response.data;
      let totalPigeons = 0;
      let loftedPigeons = 0;

      // Calculate total and lofted pigeons for the selected tournament
      participants.forEach((participant) => {
        totalPigeons += participant.pigeons.length;

        participant.pigeons.forEach((pigeon) => {
          if (pigeon.lofted) {
            loftedPigeons++;
          }
        });
      });

      const remainingPigeons = totalPigeons - loftedPigeons;

      // Update state with calculated stats
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
      <div className={s.top}>
        <h1>Tournament</h1>
        <IoAddCircleOutline className={s.add} onClick={adding} />
      </div>

    

      {/* Display Pigeon Stats */}
    

      {/* Add Tournament Popup */}
      {tournament && (
        <div className={s.popup}>
          <div className={s.dates}>
            <div>
              <h1>New Tournament</h1>
              <input
                className={s.datesInput}
                type="text"
                placeholder="Tournament Name"
                onChange={(e) =>
                  setNewTournament({ ...newTournament, name: e.target.value })
                }
              />
            </div>
            <div>
              <h2>Start Date</h2>
              <input
                className={s.datesInput}
                type="date"
                onChange={(e) =>
                  setNewTournament({
                    ...newTournament,
                    startDate: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <h2>End Date</h2>
              <input
                className={s.datesInput}
                type="date"
                onChange={(e) =>
                  setNewTournament({
                    ...newTournament,
                    endDate: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <h2>Start Time</h2>
              <input
                className={s.datesInput}
                type="time"
                onChange={(e) =>
                  setNewTournament({
                    ...newTournament,
                    startTime: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <h2>Enter No of Pigeons</h2>
              <input
                className={s.datesInput}
                type="number"
                onChange={(e) =>
                  setNewTournament({
                    ...newTournament,
                    pigeons: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className={s.button}>
            <button className={s.cancelbtn} onClick={adding}>
              Cancel
            </button>
            <button className={s.addbtn} onClick={handleAddTournament}>
              Add
            </button>
          </div>
        </div>
      )}
      {/* Add persons Popup*/}
      {addPerson && (
        <div className={s.popup}>
          <h1>Add Participant</h1>
          <h2>Enter name</h2>
          <input
            type="text"
            placeholder="Name"
            onChange={(e) =>
              setNewParticipant({ ...newParticipant, name: e.target.value })
            }
            className={s.addingPersonInputs}
          />
          {/* <h2>Enter Address</h2>
          <input
            className={s.addingPersonInputs}
            type="text"
            placeholder="Address"
            onChange={(e) =>
              setNewParticipant({ ...newParticipant, address: e.target.value })
            }
          /> */}
          <h2>Enter Piegons</h2>
          <input
            className={s.addingPersonInputs}
            type="number"
            placeholder="Number of Pigeons"
            value={newParticipant.pigeons}
            onChange={(e) => {
              setNewParticipant({ ...newParticipant, pigeons: e.target.value });
            }}
          />
          <h2>Enter Image</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={s.addingPersonInputs}
          />
          <div className={s.button}>
            <button className={s.cancelbtn} onClick={() => setAddPerson(false)}>
              Cancel
            </button>
            <button className={s.addbtn} onClick={handleAddParticipant}>
              Add
            </button>
          </div>
        </div>
      )}

      {/* Tournament Table */}
      <div className={s.table}>
        <table className={s.tournamenttable}>
          <thead>
            <tr>
              <th>Count</th>
              <th>Name</th>
              <th>Participants</th>
              <th>Edit</th>
              <th>Remove</th>
              <th>Details</th>
              {/* <th>Pin</th> */}
            </tr>
          </thead>
          <tbody>
            {data.map((tournament, index) => (
              <tr key={tournament._id}>
                <td>{index + 1}</td>
                <td>{tournament.name}</td>
                <td>
                  <AiOutlineUsergroupAdd
                    className={s.addperson}
                    onClick={() => addingPerson(tournament._id)}
                  />
                </td>
                <td>
                  <BiEdit
                    className={s.edit}
                    onClick={() => editing(tournament)}
                  />
                </td>
                <td>
                  <FaMinusCircle
                    className={s.remove}
                    onClick={() => removeItem(tournament._id)}
                  />
                </td>
                <td>
                  <NavLink to={`/tournament/${tournament._id}/participants`}>
                    <IoIosPeople className={s.addperson} />
                  </NavLink>
                </td>
                {/* <td>
                  {tournament.pinned ? (
                    <AiFillPushpin
                      className={s.pinned}
                      onClick={() => handlePinTournament(tournament._id)}
                    />
                  ) : (
                    <AiOutlinePushpin
                      className={s.unpinned}
                      onClick={() => handlePinTournament(tournament._id)}
                    />
                  )}
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Tournament Popup */}
      {editTournament && (
        <div className={s.popup}>
          <div className={s.dates}>
            <div>
              <h1>Edit Tournament</h1>
              <input
                className={s.inputs}
                type="text"
                value={editData.name}
                onChange={(e) =>
                  setEditData({ ...editData, name: e.target.value })
                }
              />
            </div>
            <div>
              <h2>Start Date</h2>
              <input
                className={s.datesInput}
                type="date"
                value={editData.startDate}
                onChange={(e) =>
                  setEditData({ ...editData, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <h2>End Date</h2>
              <input
                className={s.datesInput}
                type="date"
                value={editData.endDate}
                onChange={(e) =>
                  setEditData({ ...editData, endDate: e.target.value })
                }
              />
            </div>
            <div>
              <h2>Start Time</h2>
              <input
                className={s.datesInput}
                type="time"
                value={editData.startTime}
                onChange={(e) =>
                  setEditData({ ...editData, startTime: e.target.value })
                }
              />
            </div>
            <div>
              <h2>Enter No of Pigeons</h2>
              <input
                className={s.datesInput}
                type="number"
                value={editData.pigeons}
                onChange={(e) =>
                  setEditData({ ...editData, pigeons: e.target.value })
                }
              />
            </div>
          </div>
          <div className={s.button}>
            <button
              className={s.cancelbtn}
              onClick={() => setEditTournament(false)}
            >
              Cancel
            </button>
            <button className={s.addbtn} onClick={handleEditTournament}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tournament;
