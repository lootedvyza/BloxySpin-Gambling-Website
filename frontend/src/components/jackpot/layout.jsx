import { useCallback, useState, useContext, useEffect, useRef } from "react";
import UserContext from "../../utils/user.js";
import { api } from "../../config.js";
import Profile from "../popup/profile";
import { useModal } from "../../utils/ModalContext";
import SocketContext from "../../utils/socket.js";
import JoinJackpot from "./joinjackpot.jsx";
import LoginModal from "../popup/login.jsx";
import { Money } from "@/assets/exports.jsx";
import Wheel from "./Wheel.jsx";
import { COLORS } from "./colors.js";

export default function JackpotPage() {
  const { setModalState } = useModal();
  const { userData } = useContext(UserContext);
  const socket = useContext(SocketContext);
  const [jackpotData, setJackpotData] = useState({ value: 0 });
  const [timeRemaining, setTimeRemaining] = useState("0s");
  const [jackpotEntries, setJackpotEntries] = useState([]);

  const [showWinner, setShowWinner] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetch(`${api}/jackpot`, {
      mode: "cors",
      method: "GET",
    })
      .then(async (res) => {
        const data = await res.json();
        setJackpotData(data.gameData);
        setJackpotEntries(data.entries || []);
      })
      .catch((error) => console.error("Failed to fetch jackpot!", error));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof timeRemaining === "number" && timeRemaining > 0) {
        setTimeRemaining((prev) => prev - 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const handleJackpotUpdate = useCallback((data) => {
    setJackpotData(data.gameData);
    setJackpotEntries(data.entries || []);

    if (data.entries.length === 0) {
      setJackpotData((prevData) => ({
        ...prevData,
        result: null,
      }));
    }
  }, []);

  const handleTimeUpdate = (time) => {
    const timeString = String(time);
    if (timeString.includes("...")) {
      setTimeRemaining("0s");
      setShowWinner(false);
    } else {
      setTimeRemaining(`${timeString}s`);
    }
  };

  useEffect(() => {
    if (jackpotData.result) {
      audioRef.current = new Audio(Money);
      audioRef.current
        .play()
        .catch((error) => console.error("Audio playback error:", error));
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [jackpotData.result]);

  useEffect(() => {
    socket.on("JACKPOT_UPDATE", handleJackpotUpdate);
    socket.on("JACKPOT_TIME_UPDATE", handleTimeUpdate);
    return () => {
      socket.off("JACKPOT_UPDATE", handleJackpotUpdate);
      socket.off("JACKPOT_TIME_UPDATE", handleTimeUpdate);
    };
  }, [socket, handleJackpotUpdate, handleTimeUpdate]);

  return (
    <div className="box-border h-full flex flex-wrap items-center justify-evenly gap-8 p-4">
      <Wheel
        jackpotData={jackpotData}
        jackpotEntries={jackpotEntries}
        showWinner={showWinner}
        timeRemaining={timeRemaining}
        setShowWinner={setShowWinner}
      />

      <div className="flex flex-col justify-center items-center text-center w-[min(90vw,22rem)] pt-2 h-[32rem] rounded-lg bg-[#171925] border border-solid border-[#252839] box-border">
        <div className="w-full box-border px-2 mx-auto overflow-y-auto flex flex-col gap-2 flex-1">
          {jackpotEntries.map((entry, index) => {
            let toRender = entry.items.slice(0, 4);
            return (
              <div className="flex box-border flex-col bg-[#1C1F2E] border border-solid border-[#252839] p-4 m-0 rounded-lg transition-transform duration-200 ease-in-out" key={index}>
                <div className="flex justify-start items-center mb-2 ">
                  <div className="flex items-center ">
                    <img
                      src={entry.thumbnail}
                      alt="User Profile Picture"
                      onClick={() =>
                        setModalState(<Profile userid={entry.joinerid} />)
                      }
                      className="w-[clamp(30px,4vw,40px)] h-[clamp(30px,4vw,40px)] rounded-full mr-4 transition-all duration-400 cursor-pointer border-2 border-transparent hover:border-[#007bff] hover:opacity-90"
                    />
                    <p
                      style={{
                        background: COLORS[index],
                        color: "rgb(25, 24, 24)",
                        fontWeight: "610",
                      }}
                      className="rounded-full py-[0.5px] px-[5px] mr-[10px] ml-[-8px] text-[rgb(25,24,24)]"
                    >
                      {entry.username}{" "}
                    </p>
                    <p className="text-white font-medium text-[clamp(14px,1.5vw,16px)]">
                      {Math.round(
                        (entry.value / jackpotData.value) * 100 * 100,
                      ) / 100}
                      %
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-[-20px] pt-1 w-full">
                    {toRender.map((item, index) => (
                      <div className="flex items-center justify-center text-a">
                        <img className="w-[40px] h-[40px] rounded-sm" src={item.itemimage}/>
                        </div>
                    ))}
                    {entry.items.length > 4 && (
                      <div className="flex items-center justify-center bg-black bg-opacity-70 rounded-md ml-1 w-[40px] h-[40px] min-w-[40px] z-[3]">
                        <p className="text-white font-medium">
                          +{entry.items.length - 4}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
            );
          })}
        </div>
        <div className="flex justify-center items-center p-4" >
          <button
            onClick={() =>
              setModalState(userData ? <JoinJackpot /> : <LoginModal />)
            }
            className="button w-full text-[clamp(14px,1.8vw,16px)] text-center"
            disabled={jackpotEntries.length >= 50 || jackpotData.result}
          >
            {jackpotEntries.length >= 50
              ? "Jackpot is full"
              : showWinner && jackpotData.result
                ? "starting soon..."
                : jackpotData.result
                  ? "rolling..."
                  : `Place a bet (${timeRemaining})`}
          </button>
        </div>
      </div>
    </div>
  );
}