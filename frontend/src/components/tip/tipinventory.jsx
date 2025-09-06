import React, { useContext, useState, useEffect, useMemo } from "react";
import inventorystyles from "./inventorytip.module.css";
import toast from "react-hot-toast";
import UserContext from "../../utils/user.js";
import { useModal } from "../../utils/ModalContext";
import { getauth } from "../../utils/getauth.js";
import Deposit from "../popup/deposit.jsx";
import Profile from "../popup/profile.jsx";
import { api } from "../../config.js";
import { Items, Bobux, Search } from "../../assets/exports.jsx";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatLargeNumber } from "@/utils/value";

export default function Tip({ user }) {
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
  const [tipping, setTipping] = useState(false);
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

  const tipuser = async () => {
    if (selectedItems.length === 0) {
      toast.error("select items!");
      return;
    }

    setTipping(true);

    try {
      const response = await fetch(`${api}/users/tip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${getauth()}`,
        },
        body: JSON.stringify({
          touser: user.userid,
          items: selectedItems.map((selectedItem) => ({
            inventoryid: selectedItem.inventoryid,
          })),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        closeModal();
        setTimeout(() => {
          setModalState(<Profile userid={user.userid} />);
        }, 500);
        toast.success(data.message || "Successfully tipped!");
      } else {
        setTipping(false);
        toast.error(data.message || "could not tip...");
      }
    } catch (err) {
      setTipping();
      console.log(err);
      toast.error("Something went wrong...");
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const toggleItem = (item) => {
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

  const selectalll = () => {
    if (inventory.length <= 0) return toast.error("No items to use!");

    if (selectedItems.length === inventory.length) {
      setSelectedItems([]);
      setSelectedValue(0);
    } else {
      setSelectedItems(inventory);
      const totalSelectedValue = inventory.reduce(
        (sum, item) => sum + (item.itemvalue || 0),
        0,
      );
      setSelectedValue(totalSelectedValue);
    }
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setModalState(null);
    }, 200);
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

  return (
    <div className={inventorystyles.blurbg} onClick={() => closeModal()}>
      <div
        className={`${inventorystyles.modalbackgroundinventory} ${inventorystyles.fadeIn} ${isClosing ? inventorystyles.shrinkOut : ""}`}
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

        <div className={inventorystyles.buttonWrapper}>
          <button
            className="buttoncolorful"
            onClick={selectalll}
            disabled={inventory.length < 1 || tipping}
          >
            {filteredInventory.filter(
              (item) => !item.locked && item.itemvalue !== 0,
            ).length === 0
              ? "Select All"
              : selectedItems.length ===
                  filteredInventory.filter(
                    (item) => !item.locked && item.itemvalue !== 0,
                  ).length
                ? "Unselect All"
                : "Select All"}
          </button>
          <button
            className={`button ${tipping ? "loading" : ""}`}
            onClick={tipuser}
            disabled={tipping || !selectedItems.length}
          >
            {tipping && (
              <div className={inventorystyles.loaderWrapperSmall}>
                <div className={inventorystyles.loaderSmall}></div>
              </div>
            )}
            <strong className={inventorystyles.pcvalue}>
              Tip R${selectedValue.toLocaleString()}
            </strong>
            <strong className={inventorystyles.mobilevalue}>
              Tip R${formatLargeNumber(selectedValue)}
            </strong>
          </button>
        </div>
      </div>
    </div>
  );
}
