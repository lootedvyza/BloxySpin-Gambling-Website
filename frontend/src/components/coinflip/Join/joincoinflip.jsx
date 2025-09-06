import React, { useContext, useState, useEffect, useMemo } from "react";
import inventorystyles from "./inventorycf.module.css";
import toast from "react-hot-toast";
import UserContext from "../../../utils/user.js";
import { useModal } from "../../../utils/ModalContext";
import { getauth } from "../../../utils/getauth.js";
import Deposit from "../../popup/deposit.jsx";
import { api } from "../../../config.js";
import {
  Items,
  Bobux,
  Search,
  Trails,
  Heads,
} from "../../../assets/exports.jsx";
import View from "../View/view.jsx";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatLargeNumber } from "@/utils/value";

export default function JoinMatch({ coinflip, onJoin, onClose }) {
  const { userData, setUserData } = useContext(UserContext);
  const { setModalState } = useModal();
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedValue, setSelectedValue] = useState(0);
  const [sortOrder, setSortOrder] = useState("highest");
  const [selectedGame, setSelectedGame] = useState("all");
  const [join, setJoin] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const loadInventory = async () => {
    if (!userData) {
      toast.error("You are not logged in!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${api}/me/inventory`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${getauth()}`,
        },
      });
      const data = await response.json();
      setLoading(false);
      if (response.ok) {
        setInventory(data.data);
        const total = data.data.reduce(
          (sum, item) => sum + (item.itemvalue || 0),
          0,
        );
        setTotalValue(total);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to load inventory.");
      setLoading(false);
    }
  };

  const joinmatch = async () => {
    if (selectedItems.length === 0) {
      toast.error("Select items!");
      return;
    }

    setJoin(true);

    try {
      const response = await fetch(`${api}/coinflips/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${getauth()}`,
        },
        body: JSON.stringify({
          gameid: coinflip._id,
          items: selectedItems.map((selectedItem) => ({
            inventoryid: selectedItem.inventoryid,
          })),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        onJoin(data.data);
        setJoin(false);
        setModalState(<View coinflip={data.data} onClose={onClose} />);
        toast.success("Successfully joined the game!");
      } else {
        setJoin(false);
        toast.error(data.message);
      }
    } catch (err) {
      setLoading(false);
      toast.error("Something went wrong...");
    }
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setModalState(null);
    }, 200);
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const toggleItem = (item) => {
    if (item.locked) {
      toast.error("You cannot select locked items!");
      return;
    }

    if (item.itemvalue === 0) {
      toast.error("You cannot select zero-value items!");
      return;
    }

    const isSelected = selectedItems.some(
      (selected) => selected.inventoryid === item.inventoryid,
    );

    if (isSelected) {
      setSelectedItems((prev) =>
        prev.filter((selected) => selected.inventoryid !== item.inventoryid),
      );
      setSelectedValue((prevValue) => prevValue - item.itemvalue);
    } else {
      setSelectedItems((prev) => [...prev, item]);
      setSelectedValue((prevValue) => prevValue + item.itemvalue);
    }
  };

  const filteredInventory = useMemo(() => {
    let filteredItems = inventory.filter(
      (item) =>
        item.itemname &&
        typeof item.itemname === "string" &&
        item.itemname.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (selectedGame !== "all") {
      filteredItems = filteredItems.filter(
        (item) => item.game === selectedGame,
      );
    }

    const selectedItemsSet = new Set(
      selectedItems.map((item) => item.inventoryid),
    );
    const selectedItemsFirst = filteredItems.filter((item) =>
      selectedItemsSet.has(item.inventoryid),
    );
    const otherItems = filteredItems.filter(
      (item) => !selectedItemsSet.has(item.inventoryid),
    );

    if (sortOrder === "lowest") {
      selectedItemsFirst.sort((a, b) => a.itemvalue - b.itemvalue);
      otherItems.sort((a, b) => a.itemvalue - b.itemvalue);
    } else {
      selectedItemsFirst.sort((a, b) => b.itemvalue - a.itemvalue);
      otherItems.sort((a, b) => b.itemvalue - a.itemvalue);
    }

    return [...selectedItemsFirst, ...otherItems];
  }, [inventory, searchTerm, selectedGame, sortOrder, selectedItems]);

  const autoSelectItems = () => {
    if (inventory.length <= 0) return toast.error("No items to use!");
    const validItems = inventory.filter(
      (item) =>
        !item.locked && item.itemvalue !== 0 && item.game == coinflip.game,
    );
    validItems.sort((a, b) => b.itemvalue - a.itemvalue);

    let selected = [];
    let totalValue = 0;

    for (let i = 0; i < validItems.length; i++) {
      if (totalValue + validItems[i].itemvalue <= coinflip.requirements.max) {
        selected.push(validItems[i]);
        totalValue += validItems[i].itemvalue;

        if (totalValue >= coinflip.requirements.min) {
          break;
        }
      }
    }

    if (
      totalValue >= coinflip.requirements.min &&
      totalValue <= coinflip.requirements.max
    ) {
      setSelectedItems(selected);
      setSelectedValue(totalValue);
    } else {
      toast.error("Could not find a matching value.");
    }
  };

  return (
    <div className={inventorystyles.blurbg} onClick={() => closeModal()}>
      <div
        className={`${inventorystyles.modalbackgroundinventory} ${isClosing ? inventorystyles.shrinkOut : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={inventorystyles.closeButton}
          onClick={() => closeModal()}
        >
          &times;
        </button>

        <div className={inventorystyles.headerinventory}>
          <div className={inventorystyles.searchContainer}>
            <div className={inventorystyles.inputWrapper}>
              <input
                type="text"
                placeholder="Search for an item..."
                value={searchTerm}
                className={inventorystyles.inputv3}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <img
                src={Search}
                alt="Search"
                className={inventorystyles.searchIcon}
              />
            </div>
          </div>

          <div className={inventorystyles.filterContainer}>
            <Select
              onValueChange={(value) => setSortOrder(value)}
              value={sortOrder}
            >
              <SelectTrigger className={inventorystyles.selector}>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className={inventorystyles.selectContent}>
                <SelectItem
                  className={inventorystyles.selectItem}
                  value="highest"
                >
                  Highest to Lowest
                </SelectItem>
                <SelectItem
                  className={inventorystyles.selectItem}
                  value="lowest"
                >
                  Lowest to Highest
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedGame}
              onValueChange={(value) => setSelectedGame(value)}
            >
              <SelectTrigger className={inventorystyles.selector}>
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent className={inventorystyles.selectContent}>
                {["all", "MM2", "PS99"].map((game) => (
                  <SelectItem
                    className={inventorystyles.selectItem}
                    value={game}
                    key={game}
                  >
                    {game === "all" ? "All Games" : game}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={inventorystyles.itemsWrapper}>
          <div className={inventorystyles.stats}>
            <div className={inventorystyles.statItem}>
              <img src={Bobux} alt="Bobux" />
              <p
                className={`${inventorystyles.statValue} ${inventorystyles.pcvalue}`}
              >
                {totalValue.toLocaleString()}R$
              </p>
              <p
                className={`${inventorystyles.statValue} ${inventorystyles.mobilevalue}`}
              >
                R${formatLargeNumber(totalValue)}
              </p>
            </div>
            <div className={inventorystyles.statItem}>
              <img src={Items} alt="Items" />
              <p className={inventorystyles.statValue}>{inventory.length}</p>
            </div>
            <button
              className={`button ${inventorystyles.plusbutton}`}
              onClick={() => setModalState(<Deposit />)}
            >
              +
            </button>
          </div>
          <div className={inventorystyles.itemsGrid}>
            {loading && (
              <div className={inventorystyles.loaderWrapper}>
                <div className={inventorystyles.loader}></div>
              </div>
            )}
            {filteredInventory.length === 0 && !loading ? (
              <div className={inventorystyles.emptyState}>
                <h1>No items!</h1>
                <p>No items were found...</p>
                <button
                  className="button"
                  onClick={() => setModalState(<Deposit />)}
                >
                  Deposit
                </button>
              </div>
            ) : (
              filteredInventory.map((item) => {
                const isSelected = selectedItems.some(
                  (selected) => selected.inventoryid === item.inventoryid,
                );

                return (
                  <div
                    key={item.inventoryid}
                    className={`${inventorystyles.itemBox} ${isSelected ? inventorystyles.selected : ""}`}
                    onClick={() => toggleItem(item)}
                  >
                    <div className={inventorystyles.imageWrapper}>
                      <img
                        src={item.itemimage}
                        alt={item.itemname}
                        className={`${inventorystyles.itemImage} ${inventorystyles.normalImage}`}
                      />
                      <img
                        src={item.itemimage}
                        alt={item.itemname}
                        className={`${inventorystyles.itemImage} ${inventorystyles.blurritem}`}
                      />
                    </div>
                    <div className={inventorystyles.itemDetails}>
                      <p className={inventorystyles.itemName}>
                        {item.itemname}
                      </p>
                      <p className={inventorystyles.itemPrice}>
                        {item.itemvalue ? `${item.itemvalue}R$` : "0R$"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={inventorystyles.parentWrapper}>
          <div className={inventorystyles.valueWrapper}>
            <h3 className={inventorystyles.pcvalue}>
              {coinflip.requirements.min.toLocaleString()} -{" "}
              {coinflip.requirements.max.toLocaleString()}
            </h3>
            <h3 className={inventorystyles.mobilevalue}>
              {formatLargeNumber(coinflip.requirements.min)}{" "}
              {formatLargeNumber(coinflip.requirements.max)}
            </h3>
          </div>

          <div className={inventorystyles.buttonWrapper}>
            <div className={inventorystyles.coins}>
              <img
                className={`${inventorystyles.coin} ${coinflip.PlayerOne.coin === "trails" ? inventorystyles.selectedcoin : ""}`}
                src={Heads}
                alt="heads"
              />
              <img
                className={`${inventorystyles.coin} ${coinflip.PlayerOne.coin === "heads" ? inventorystyles.selectedcoin : ""}`}
                src={Trails}
                alt="trails"
              />
            </div>

            <button
              className="buttoncolorful"
              onClick={autoSelectItems}
              disabled={!inventory.length || join}
            >
              Auto Select
            </button>

            <button
              className={`button ${join ? "loading" : ""}`}
              onClick={joinmatch}
              disabled={join || !selectedItems.length}
            >
              {join && (
                <div className={inventorystyles.loaderWrapperSmall}>
                  <div className={inventorystyles.loaderSmall}></div>
                </div>
              )}
              <strong className={inventorystyles.pcvalue}>
                Join R${selectedValue.toLocaleString()}
              </strong>
              <strong className={inventorystyles.mobilevalue}>
                Join R${formatLargeNumber(selectedValue)}
              </strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
