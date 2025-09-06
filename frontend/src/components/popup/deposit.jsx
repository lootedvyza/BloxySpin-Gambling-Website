import React, { useState, useEffect } from "react";
import { useModal } from "../../utils/ModalContext";
import DepositStyles from "./deposit.module.css";
import toast from "react-hot-toast";
import { api } from "../../config.js";
import { getauth } from "../../utils/getauth.js";
import Profile from "./profile.jsx";

export default function Deposit() {
  const { setModalState } = useModal();
  const [loading, setLoading] = useState(false);
  const [bots, setBots] = useState([]);
  const [responseCode, setResponseCode] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const fetchBots = async () => {
      setLoading(true);
      setResponseCode("");
      setBots([]);

      try {
        const response = await fetch(`${api}/bots/Ps99`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${getauth()}`,
          },
        });

        const data = await response.json();

        if (data.bots) {
          setBots(data.bots);
          setResponseCode(data.code);
        }
      } catch (error) {
        toast.error("Could not fetch the bots!");
      } finally {
        setLoading(false);
      }
    };

    fetchBots();
  }, []);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setModalState(null);
    }, 200);
  };

  return (
    <div className={DepositStyles.blurbg} onClick={closeModal}>
      <div
        className={`${DepositStyles.modalbackgrounddeposit} ${
          isClosing ? DepositStyles.shrinkOut : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={DepositStyles.closeButton} onClick={closeModal}>
          &times;
        </button>

        <div className={DepositStyles.modalContent}>
          <h1 className={DepositStyles.depositTitle}>Deposit</h1>

          {responseCode && (
            <div className={DepositStyles.responseCode}>
              <p>
                Your Code:{" "}
                <span className={DepositStyles.actualcode}>{responseCode}</span>
              </p>
              <p>
                The bot will always tell you the code when trading with them!
              </p>
            </div>
          )}

          {bots.length > 1 ? (
            <ul className={DepositStyles.botList}>
              {bots.map((bot, index) => (
                <li key={index} className={DepositStyles.botItem}>
                  <div className={DepositStyles.botDetails}>
                    <div className={DepositStyles.statusWrapper}>
                      <img
                        src={bot.pfp}
                        alt={bot.name}
                        className={DepositStyles.botPfp}
                        onClick={() =>
                          setModalState(<Profile userid={bot.userid || 1} />)
                        }
                      />
                      <span className={DepositStyles.botName}>{bot.name}</span>
                      <div className={DepositStyles.circle_holder}>
                        <div
                          className={`${DepositStyles.online_circle} ${
                            bot.online
                              ? DepositStyles.online_circle_active
                              : DepositStyles.online_circle_inactive
                          }`}
                        ></div>
                        <div
                          className={`${DepositStyles.inner_circle} ${
                            bot.online
                              ? DepositStyles.inner_circle_active
                              : DepositStyles.inner_circle_inactive
                          }`}
                        ></div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        bot.online
                          ? window.open(bot.link, "_blank")
                          : toast.error("You cannot join offline bots!");
                      }}
                      className={`${DepositStyles.joinbutton} button`}
                    >
                      Join
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            !loading && (
              <div className={DepositStyles.discorder}>
                <p>Join our discord for the bots!</p>
                <button
                  className="button"
                  onClick={() =>
                    window.open("https://discord.gg/5gAJ8mBh", "_blank")
                  }
                >
                  Join
                </button>
              </div>
            )
          )}

          {loading && (
            <div className={DepositStyles.loaderWrapper}>
              <div className={DepositStyles.loader}></div>
            </div>
          )}

          <div className={DepositStyles.footer}>
            <p>
              Always verify that the username of your trading partner matches
              exactly; users often impersonate bots with similar names.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
