import LeaderboardStyles from "./leaderboard.module.css";
import toast from "react-hot-toast";
import { useModal } from "../../utils/ModalContext";
import { useEffect, useState } from "react";
import { api } from "../../config";
import Profile from "./profile.jsx";
import { Bobux, BuilderMan } from "../../assets/exports.jsx";
import { formatLargeNumber } from "@/utils/value";

export default function Leaderboard() {
  const { setModalState } = useModal();
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [leaders, setLeaders] = useState([]);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setModalState(null);
    }, 200);
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    setLeaders(
      Array.from({ length: 10 }, (_, index) => ({
        _id: `${index + 1}`,
        username: "???",
        thumbnail: BuilderMan,
        wager: 0,
        won: 0,
        lost: 0,
      })),
    );
    try {
      const response = await fetch(`${api}/users/leaderboard`);
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }
      const data = await response.json();
      setLeaders(data.leaders || []);
    } catch (error) {
      toast.error("Failed to fetch leaderboard!");
      setLeaders(
        Array.from({ length: 10 }, (_, index) => ({
          _id: `${index + 1}`,
          username: "???",
          thumbnail: BuilderMan,
          wager: 0,
          won: 0,
          lost: 0,
        })),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className={LeaderboardStyles.blurbg} onClick={closeModal}>
      <div
        className={`${LeaderboardStyles.leaderboardModal} ${isClosing ? LeaderboardStyles.shrinkOut : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={LeaderboardStyles.title}>
          <h1>Leaderboard</h1>
          <button
            className={LeaderboardStyles.closeButton}
            onClick={closeModal}
          >
            &times;
          </button>
        </div>
        {loading ? (
          <div className={LeaderboardStyles.loaderWrapper}>
            <div className={LeaderboardStyles.loader}></div>
          </div>
        ) : leaders.length > 0 ? (
          <div className={LeaderboardStyles.contentContainer}>
            <div className={LeaderboardStyles.headerRow}>
              <div className={LeaderboardStyles.headerNumber}>#</div>
              <div className={LeaderboardStyles.headerUser}>User</div>
              <div className={LeaderboardStyles.headerWager}>Wager</div>
              <div className={LeaderboardStyles.headerProfit}>Profit</div>
            </div>

            <div className={LeaderboardStyles.leaderList}>
              {leaders.map((leader, index) => {
                const profit = leader.won - leader.lost;
                const formattedProfit = formatLargeNumber(Math.abs(profit));
                return (
                  <div
                    key={leader._id}
                    className={LeaderboardStyles.leaderItem}
                  >
                    <div
                      className={` ${LeaderboardStyles.positionNumber} ${
                        index === 0
                          ? LeaderboardStyles.gold
                          : index === 1
                            ? LeaderboardStyles.silver
                            : index === 2
                              ? LeaderboardStyles.bronze
                              : ""
                      } `}
                    >
                      #{index + 1}
                    </div>
                    <div className={LeaderboardStyles.user}>
                      <img
                        src={leader.thumbnail}
                        alt={leader.username}
                        className={LeaderboardStyles.avatar}
                        onClick={() =>
                          setModalState(<Profile userid={leader.userid} />)
                        }
                      />
                      <div className={LeaderboardStyles.usernameColumn}>
                        {leader.username}
                      </div>
                    </div>
                    <div
                      className={`${LeaderboardStyles.statColumn} ${LeaderboardStyles.wager}`}
                    >
                      <img
                        src={Bobux}
                        alt="Bobux icon"
                        className={LeaderboardStyles.icon}
                      />
                      {formatLargeNumber(leader.wager)}
                    </div>
                    <div
                      className={`${LeaderboardStyles.statColumn} ${LeaderboardStyles.profit}`}
                    >
                      <img
                        src={Bobux}
                        alt="Bobux icon"
                        className={LeaderboardStyles.icon}
                      />
                      {profit < 0 ? "-" : ""}
                      {formattedProfit}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={LeaderboardStyles.noLeaders}>No leaders found.</div>
        )}
      </div>
    </div>
  );
}
