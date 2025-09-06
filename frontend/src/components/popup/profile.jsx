import { useEffect, useState, useContext } from "react";
import toast from "react-hot-toast";
import { useModal } from "../../utils/ModalContext";
import styles from "./profile.module.css";
import { api } from "../../config";
import Tip from "../tip/tipinventory.jsx";
import { getrole } from "../../utils/getrole";
import { Bobux } from "../../assets/exports.jsx";
import { formatLargeNumber } from "../../utils/value.js";
import UserContext from "../../utils/user";
import { BuilderMan } from "../../assets/exports.jsx";

export default function Profile({ userid }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ wager: 0, level: 0, won: 0, lost: 0 });
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { userData } = useContext(UserContext);
  const { setModalState } = useModal();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${api}/users/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userid }),
        });
        if (!res.ok) throw new Error("Profile not found");
        const data = await res.json();
        if (!data?.data) throw new Error("Invalid profile data");
        setProfile(data.data);
      } catch (err) {
        toast.error(err.message || "Error loading profile.");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userid]);

  useEffect(() => {
    if (profile) {
      Object.entries(profile).forEach(([key, value]) => {
        if (key in stats)
          animateStat(value, (val) => setStats((s) => ({ ...s, [key]: val })));
      });
    }
  }, [profile]);

  const animateStat = (target, setter) => {
    let current = 0;
    const interval = setInterval(() => {
      current += target / 60;
      if (current >= target) {
        setter(target);
        clearInterval(interval);
      } else setter(Math.floor(current));
    }, 1000 / 60);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => setModalState(null), 200);
  };

  const role = getrole(profile?.rank, profile?.level);

  return (
    <div className={`${styles.blurbg} ${styles.fadeIn}`} onClick={handleClose}>
      <div
        className={`${styles.modalbackgroundprofile} ${styles.fadeIn} ${
          isClosing ? styles.shrinkOut : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeButton} onClick={handleClose}>
          &times;
        </button>
        {loading ? (
          <div className={styles.loaderWrapper}>
            <div className={styles.loader}></div>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <img
                src={profile?.thumbnail || BuilderMan}
                alt="Profile"
                className={styles.pfp}
              />
              <div className={styles.userInfo}>
                <h2 className={styles.username}>
                  {profile?.username || "Unknown"}
                </h2>

                <div className={styles.roleWrapper}>
                  <p className={styles.rank} style={{ color: role.color }}>
                    {role.name}
                  </p>
                  {role.image && (
                    <img
                      src={role.image}
                      className={styles.rankImage}
                      alt="Role Icon"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className={styles.stats}>
              <div className={styles.statRow}>
                <div className={styles.statBox}>
                  <strong>Wager</strong>
                  <div className={styles.statValue}>
                    <img src={Bobux} alt="Wager Icon" />
                    <span>
                      {profile
                        ? formatLargeNumber(stats.wager) || "???"
                        : "???"}
                    </span>
                  </div>
                </div>
                <div className={styles.statBox}>
                  <strong>Level</strong>
                  <div className={styles.statValue}>
                    <span>{profile ? stats.level || 0 : "???"}</span>
                  </div>
                </div>
              </div>
              <div className={styles.statRow}>
                <div className={styles.statBox}>
                  <strong>Won</strong>
                  <div className={styles.statValue}>
                    <img src={Bobux} alt="Won Icon" />
                    <span>
                      {profile ? formatLargeNumber(stats.won) || "???" : "???"}
                    </span>
                  </div>
                </div>
                <div className={styles.statBox}>
                  <strong>Lost</strong>
                  <div className={styles.statValue}>
                    <img src={Bobux} alt="Lost Icon" />
                    <span>
                      {profile ? formatLargeNumber(stats.lost) || "???" : "???"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.tipButtonWrapper}>
              <button
                className="button"
                disabled={!userData || !profile?.username}
                onClick={() =>
                  setModalState(
                    <Tip
                      user={{
                        username: profile.username,
                        userid: profile.userid,
                      }}
                    />,
                  )
                }
              >
                Tip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
