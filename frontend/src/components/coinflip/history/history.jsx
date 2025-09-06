import React, { useState, useEffect } from "react";
import { useModal } from "../../../utils/ModalContext";
import HistoryStyles from "./history.module.css";
import toast from "react-hot-toast";
import { api } from "../../../config.js";
import { getauth } from "../../../utils/getauth.js";
import Profile from "../../popup/profile.jsx";
import Heads from "../../../assets/images/heads.png";
import Trails from "../../../assets/images/trails.png";
import Bobux from "../../../assets/images/bobux.png";
import { formatLargeNumber } from "@/utils/value";
import View from "../View/view.jsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function History() {
  const { setModalState } = useModal();
  const [loading, setLoading] = useState(false);
  const [coinflips, setCoinflips] = useState([]);
  const [isClosing, setIsClosing] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchflips = async () => {
      setLoading(true);
      setCoinflips([]);
      try {
        const response = await fetch(`${api}/coinflips/history/me`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${getauth()}`,
          },
        });
        const data = await response.json();
        if (data.history) {
          setCoinflips(data.history);
        } else {
          toast.error(data.message || "Could not fetch the history!");
          setCoinflips([]);
        }
      } catch (error) {
        toast.error("Could not fetch the history!");
        setCoinflips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchflips();
  }, []);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setModalState(null);
    }, 200);
  };

  const renderItems = (playerItems, playerTwoItems) => {
    const itemsssssslay = [...playerItems, ...playerTwoItems].sort(
      (a, b) => b.itemvalue - a.itemvalue,
    );

    return (
      <TooltipProvider delayDuration={0}>
        <div className={HistoryStyles.itemholder}>
          {itemsssssslay.slice(0, 3).map((item) => (
            <Tooltip key={item._id}>
              <TooltipTrigger className="border-none bg-transparent">
                <div className={HistoryStyles.itemWrapper}>
                  <div className={HistoryStyles.imageContainer}>
                    <img
                      src={item.itemimage}
                      className={HistoryStyles.backgroundImage}
                    />
                    <img
                      src={item.itemimage}
                      alt={item.itemname}
                      className={HistoryStyles.itemone}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="tooltip z-[9999]">
                <p>{item.itemname || "Unknown Item"}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {itemsssssslay.length > 3 && (
            <div className={HistoryStyles.itemCount}>
              +{itemsssssslay.length - 3}
            </div>
          )}
        </div>
      </TooltipProvider>
    );
  };

  const handleViewFlip = (flip) => {
    setModalState(<View coinflip={flip} onClose={null} />);
  };

  return (
    <div className={HistoryStyles.blurbg} onClick={closeModal}>
      <div
        className={`${HistoryStyles.modalbackgroundhistory} ${
          isClosing ? HistoryStyles.shrinkOut : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={HistoryStyles.closeButton} onClick={closeModal}>
          &times;
        </button>

        <div className={HistoryStyles.modalContent}>
          <h1 className={HistoryStyles.historyTitle}>Coinflips</h1>

          {loading ? (
            <div className={HistoryStyles.loaderWrapper}>
              <div className={HistoryStyles.loader}></div>
            </div>
          ) : (
            <div className={HistoryStyles.coinflips}>
              {coinflips.map((flip) => (
                <div key={flip._id} className={HistoryStyles.flip}>
                  <div className={HistoryStyles.players}>
                    <div
                      className={`${HistoryStyles.player} ${
                        flip.PlayerTwo
                          ? flip.winner === flip.PlayerOne.id
                            ? HistoryStyles.winner
                            : HistoryStyles.loser
                          : ""
                      }`}
                    >
                      <div className={HistoryStyles.playerCoin}>
                        <img
                          src={flip.PlayerOne.coin === "heads" ? Heads : Trails}
                          alt="coin"
                          className={HistoryStyles.coinIndicator}
                        />
                      </div>
                      <img
                        src={flip.PlayerOne.thumbnail}
                        alt={flip.PlayerOne.username}
                        className={HistoryStyles.avatar}
                        onClick={() => {
                          setModalState(null);
                          setTimeout(() =>
                            setModalState(
                              <Profile userid={flip.PlayerOne.id} />,
                            ),
                          );
                        }}
                      />
                    </div>

                    <div
                      className={`${HistoryStyles.player} ${
                        flip.PlayerTwo
                          ? flip.winner === flip.PlayerTwo.id
                            ? HistoryStyles.winner
                            : HistoryStyles.loser
                          : HistoryStyles.coin
                      }`}
                    >
                      {flip.PlayerTwo ? (
                        <>
                          <div className={HistoryStyles.playerCoin}>
                            <img
                              src={
                                flip.PlayerTwo.coin === "heads" ? Heads : Trails
                              }
                              alt="coin"
                              className={HistoryStyles.coinIndicator}
                            />
                          </div>
                          <img
                            src={flip.PlayerTwo.thumbnail}
                            alt={flip.PlayerTwo.username}
                            className={HistoryStyles.avatar}
                            onClick={() => {
                              setModalState(null);
                              setTimeout(() =>
                                setModalState(
                                  <Profile userid={flip.PlayerTwo.id} />,
                                ),
                              );
                            }}
                          />
                        </>
                      ) : (
                        <div className={HistoryStyles.coinPlaceholder}>
                          <div className={HistoryStyles.playerCoin}>
                            <img
                              src={
                                flip.PlayerOne.coin === "heads" ? Trails : Heads
                              }
                              alt="coin"
                              className={HistoryStyles.coinIndicator}
                            />
                          </div>
                          <div className={HistoryStyles.questionMark}>?</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {flip.PlayerTwo && (
                    <img
                      src={flip.winnercoin === "heads" ? Heads : Trails}
                      alt="Winner Coin"
                      className={HistoryStyles.winnerCoin}
                    />
                  )}

                  <div className={HistoryStyles.itemholder}>
                    <div className={HistoryStyles.items}>
                      {renderItems(
                        flip.PlayerOne.items,
                        flip.PlayerTwo ? flip.PlayerTwo.items : [],
                      )}
                    </div>
                  </div>

                  <div className={HistoryStyles.value}>
                    <div className={HistoryStyles.topRow}>
                      <img
                        src={Bobux}
                        alt="Icon"
                        className={HistoryStyles.bobuxicon}
                      />
                      <span>{formatLargeNumber(flip.requirements.static)}</span>
                    </div>
                    <p>
                      {formatLargeNumber(flip.requirements.min)} -{" "}
                      {formatLargeNumber(flip.requirements.max)}
                    </p>
                  </div>

                  <div className={HistoryStyles.buttonsContainer}>
                    <button
                      onClick={() => handleViewFlip(flip)}
                      className="buttonsecond"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
              {coinflips.length === 0 && !loading && null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
