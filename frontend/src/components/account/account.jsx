// update needed here too

import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../utils/ModalContext";
import UserContext from "../../utils/user.js";
import AccountStyles from "./account.module.css";
import { Bobux, HightRoller, Whale } from "../../assets/exports.jsx";
import { api } from "../../config.js";
import { getauth } from "../../utils/getauth.js";
import toast from "react-hot-toast";
import { uri } from "../../config.js";
import { useSpring, animated } from "react-spring";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { getrole } from "../../utils/getrole";

export default function Account() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { userData, setUserData } = useContext(UserContext);
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil((userData?.history?.length || 0) / 10);
  const wagerAmount = userData?.wager || 0;
  const wonAmount = userData?.won || 0;
  const lostAmount = userData?.lost || 0;
  const [chat, setChat] = useState(() => {
    return localStorage.getItem("chat") === null
      ? true
      : localStorage.getItem("chat") === "true";
  });
  const [layout, setLayouts] = useState(false);

  useEffect(() => {
    const getchats = setInterval(() => {
      setChat(
        localStorage.getItem("chat") === null
          ? true
          : localStorage.getItem("chat") === "true",
      );
    }, 1);

    return () => clearInterval(getchats);
  }, []);

  useEffect(() => {
    setLayouts(true);
    const timeout = setTimeout(() => {
      setLayouts(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [chat]);

  useEffect(() => {
    if (!userData) {
      toast.error("Login to do that!");
      navigate("/");
    }
  }, [userData, navigate]);

  const wagerAnimation = useSpring({
    number: wagerAmount,
    from: { number: 0 },
    to: { number: wagerAmount },
    config: { duration: 1000 },
  });

  const wonAnimation = useSpring({
    number: wonAmount,
    from: { number: 0 },
    to: { number: wonAmount },
    config: { duration: 1000 },
  });

  const lostAnimation = useSpring({
    number: lostAmount,
    from: { number: 0 },
    to: { number: lostAmount },
    config: { duration: 1000 },
  });

  const unlinkdiscord = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${api}/me/discord/unlink`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getauth()}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Successfully unlinked your Discord!");
        userData.discordid = null;
        userData.discordusername = null;
      } else {
        toast.error(data.message || "Could not unlink your Discord");
      }
    } catch {
      toast.error("An error occurred while unlinking Discord.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (direction) => {
    setPage((prev) =>
      direction === "next"
        ? Math.min(prev + 1, totalPages)
        : Math.max(prev - 1, 1),
    );
  };

  const {
    name: rankName,
    color: rankColor,
    image: rankImage,
  } = getrole(userData?.rank, userData?.level);

  return (
    <div
      className={`${AccountStyles.profilelayout} ${layout ? AccountStyles.layoutss : ""} ${chat === false ? AccountStyles.acclonger : ""}`}
    >
      <div className={`${AccountStyles.userinfo} ${rankColor}`}>
        <img
          src={userData?.thumbnail}
          alt="User Thumbnail"
          style={{ borderColor: rankName === "User" ? "#297bff" : rankColor }}
        />
        <div className={AccountStyles.userDetails}>
          <h1
            className={AccountStyles.username}
            style={{ color: rankColor || "#fff" }}
          >
            {userData?.username}
          </h1>
          <h2
            className={`${AccountStyles.rank}`}
            style={{ color: rankColor || "#fff" }}
          >
            {rankName}
            {rankImage && (
              <img
                src={rankImage}
                alt={`${rankName} Icon`}
                data-tooltip-id="rank-tooltip"
                data-tooltip-content={rankName}
              />
            )}
          </h2>
        </div>
        <div className={AccountStyles.discordWrapper}>
          <button
            onClick={() =>
              userData?.discordid ? unlinkdiscord() : (location.href = uri)
            }
            className={`button ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading && (
              <div className={AccountStyles.loaderWrapperSmall}>
                <div className={AccountStyles.loaderSmall}></div>
              </div>
            )}
            {userData?.discordid ? "Unlink Discord" : "Link Discord"}
          </button>
          {userData?.discordid && (
            <p className={AccountStyles.discordUsername}>
              {userData.discordusername || "Unknown Username"}
            </p>
          )}
        </div>
      </div>

      <div className={AccountStyles.statsWrapper}>
        {[
          { label: "Wagered", amount: wagerAnimation },
          { label: "Won", amount: wonAnimation },
          { label: "Lost", amount: lostAnimation },
        ].map(({ label, amount }, index) => (
          <div key={index} className={AccountStyles.stats}>
            <div className={AccountStyles.statsIconAmount}>
              <img src={Bobux} alt="Bobux Icon" />
              <animated.h1>
                {amount.number.interpolate((val) => Math.floor(val))}
              </animated.h1>
            </div>
            <p className={AccountStyles.statsLabel}>{label}</p>
          </div>
        ))}
      </div>

      <div className={AccountStyles.history}>
        <p>
          Page {page} of {totalPages}
        </p>
        <div className={AccountStyles.historyList}>
          <div className={AccountStyles.historyItem}>
            <p>Type</p>
            <p>ID</p>
            <p>Date</p>
            <p>Amount</p>
          </div>
          {userData?.history
            ?.sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice((page - 1) * 10, page * 10)
            .map((item, index) => (
              <div key={index} className={AccountStyles.historyItem}>
                <p>{item.type}</p>
                <p>{item._id}</p>
                <p>{item.date}</p>
                <p>{item.amount}</p>
              </div>
            ))}
        </div>
        <div className={AccountStyles.pagination}>
          <button
            className="button"
            onClick={() => handlePageChange("prev")}
            disabled={page === 1}
          >
            <FaChevronLeft style={{ marginRight: "8px" }} /> Previous
          </button>
          <button
            className="button"
            onClick={() => handlePageChange("next")}
            disabled={page === totalPages}
          >
            Next <FaChevronRight style={{ marginLeft: "8px" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
