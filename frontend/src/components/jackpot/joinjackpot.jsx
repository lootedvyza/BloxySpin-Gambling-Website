import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import inventorystyles from "./joinjackpot.module.css";
import toast from "react-hot-toast";
import UserContext from "../../utils/user.js";
import { useModal } from "../../utils/ModalContext";
import { getauth } from "../../utils/getauth.js";
import Deposit from "../popup/deposit.jsx";
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

export default function JoinJackpot() {
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
  const [isClosing, setIsClosing] = useState(false);
  const [withdraw, setWithdraw] = useState(false);

  const loadInventory = useCallback(async () => {
    if (!userData) {
      toast.error("You are not logged in!");
      return;
    }

    setLoading(true);
    setInventory([]);
    try {
      const response = await fetch(`${api}/me/inventory`, {
        method: "POST",
        headers: { authorization: `Bearer ${getauth()}` },
      });

      const data = await response.json();
      if (response.ok) {
        setInventory(data.data);
        const total = data.data.reduce(
          (sum, item) => sum + (item.itemvalue || 0),
          0,
        );
        setTotalValue(total);
      } else {
        toast.error(data.message || "Failed to load inventory.");
      }
    } catch {
      toast.error("Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  const withdrawItems = useCallback(async () => {
    if (!selectedItems.length) {
      toast.error("Select items to use!");
      return;
    }

    setWithdraw(true);
    try {
      const response = await fetch(`${api}/jackpot/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${getauth()}`,
        },
        body: JSON.stringify({
          chosenItems: selectedItems.map(({ inventoryid }) => ({
            inventoryid,
          })),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSelectedItems([]);
        setSelectedValue(0);
        closeModal();
        toast.success("Placed Jackpot bet!");
      } else {
        toast.error(data.message || "Could not join with items.");
        setWithdraw(false);
      }
    } catch {
      toast.error("Something went wrong...");
      setWithdraw(false);
    }
  }, [selectedItems, setModalState]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const toggleItem = useCallback(
    (item) => {
      if (item.locked) {
        toast.error("Locked items cannot be selected.");
        return;
      }
      setSelectedItems((prev) =>
        prev.some(({ inventoryid }) => inventoryid === item.inventoryid)
          ? prev.filter(({ inventoryid }) => inventoryid !== item.inventoryid)
          : [...prev, item],
      );

      setSelectedValue(
        (prev) =>
          prev +
          (selectedItems.some(
            ({ inventoryid }) => inventoryid === item.inventoryid,
          )
            ? -item.itemvalue
            : item.itemvalue),
      );
    },
    [selectedItems],
  );

  const selectAll = useCallback(() => {
    if (!inventory.length) {
      toast.error("No items to select!");
      return;
    }

    const selectableItems = inventory.filter(
      (item) => !item.locked && item.itemvalue > 0,
    );

    if (selectedItems.length === selectableItems.length) {
      setSelectedItems([]);
      setSelectedValue(0);
    } else {
      setSelectedItems(selectableItems);
      const totalValue = selectableItems.reduce(
        (sum, item) => sum + (item.itemvalue || 0),
        0,
      );
      setSelectedValue(totalValue);
    }
  }, [inventory, selectedItems]);

  const filteredInventory = useMemo(() => {
    let filtered = inventory.filter(
      (item) =>
        item.itemname?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedGame === "all" || item.game === selectedGame),
    );

    const selectedSet = new Set(
      selectedItems.map(({ inventoryid }) => inventoryid),
    );
    const selected = filtered.filter(({ inventoryid }) =>
      selectedSet.has(inventoryid),
    );
    const unselected = filtered.filter(
      ({ inventoryid }) => !selectedSet.has(inventoryid),
    );

    const sortFn =
      sortOrder === "lowest"
        ? (a, b) => a.itemvalue - b.itemvalue
        : (a, b) => b.itemvalue - a.itemvalue;

    return [...selected.sort(sortFn), ...unselected.sort(sortFn)];
  }, [inventory, searchTerm, selectedGame, sortOrder, selectedItems]);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setModalState(null);
    }, 200);
  };

  return (
    <div className={inventorystyles.blurbg} onClick={closeModal}>
      <div
        className={`${inventorystyles.modalbackgroundinventory} ${inventorystyles.fadeIn} ${isClosing ? inventorystyles.shrinkOut : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close"
          className={inventorystyles.closeButton}
          onClick={closeModal}
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
              aria-label="Deposit"
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
                  ({ inventoryid }) => inventoryid === item.inventoryid,
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
            onClick={selectAll}
            disabled={inventory.length < 1 || withdraw}
          >
            {selectedItems.length === 0
              ? "Select all"
              : selectedItems.length === inventory.length
                ? "Unselect All"
                : "Select All"}
          </button>
          <button
            className={`button ${withdraw ? "loading" : ""}`}
            onClick={withdrawItems}
            disabled={withdraw || !selectedItems.length}
          >
            {withdraw && (
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
  );
}
