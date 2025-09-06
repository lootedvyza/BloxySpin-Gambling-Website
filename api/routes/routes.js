const express = require("express");
const os = require("os");
const router = express.Router();
const accountController = require("../controllers/account/index.js");
const chatController = require("../controllers/chat/index.js");
const coinflipController = require("../controllers/coinflip/index.js");
const bothandler = require("../controllers/bot/index.js");
const giveawayController = require("../controllers/giveaway/index.js");
const gamesController = require("../controllers/games/index.js");
const jackpotController = require("../controllers/jackpot/index.js"); 

router.use(express.json());

router.get("/", (req, res) => {
  const uptime = process.uptime();
  const systemUptime = os.uptime();
  const ping = Date.now() - req.startTime;

  const info = {
    ping: `${ping}ms`,
    uptime: `${uptime} seconds`,
    systemUptime: `${systemUptime} seconds`,
    cpuCores: "...",
    loadAverage: os.loadavg(),
    timestamp: new Date().toISOString(),
  };

  res.json({
    success: true,
    message: "sucessfuly pinged the spiney api.",
    data: info,
  });
});

router.post("/me", accountController.verifyToken, accountController.me);
router.post("/users/profile", accountController.profile);
router.post("/login", accountController.login);
router.post("/me/inventory", accountController.verifyToken, accountController.inventory);
router.post("/me/withdraw", accountController.verifyToken, accountController.withdraw);
router.post("/me/discord", accountController.verifyToken, accountController.linkdiscord);
router.post("/me/discord/unlink", accountController.verifyToken, accountController.unlinkdiscord);

router.post("/users/tip", accountController.verifyToken, accountController.tip);
router.get("/users/leaderboard", accountController.getleaderboard);

router.post("/items/all", bothandler.GetSupported);
router.get("/items/all", bothandler.GetSupported);

router.post("/chat/send", accountController.verifyToken, (req, res, next) => {
  const io = req.app.get('io');
  chatController.sendchat(req, res, next, io);
});
router.post("/chat/latest", chatController.latestmessages);

router.get("/coinflips/flips", coinflipController.getcoinflips);
router.post("/coinflips/create", accountController.verifyToken, coinflipController.creatematch);
router.post("/coinflips/join", accountController.verifyToken, coinflipController.joinmatch);
router.post("/coinflips/cancel", accountController.verifyToken, accountController.verifyToken, coinflipController.cancelcoinflip);
router.post("/coinflips/history/me", accountController.verifyToken, coinflipController.historyme);

router.post("/withdraw/method", bothandler.real, bothandler.Getmethod);
router.post("/withdraw/withdrawed", bothandler.real, bothandler.withdrawed);

router.post("/deposit/deposit", bothandler.real, bothandler.Deposit);

router.post("/bots/:game", accountController.verifyToken, bothandler.bots);

router.get("/giveaways/latest", giveawayController.getgiveaways);
router.post("/giveaways/create", accountController.verifyToken, giveawayController.giveaway);
router.post("/giveaways/join", accountController.verifyToken, giveawayController.joingiveaway);

router.get("/stats/all", gamesController.getvalue);

router.get("/jackpot", jackpotController.get_jackpot);
router.post("/jackpot/join", accountController.verifyToken, jackpotController.join_jackpot);

router.all("*", (req, res) => {
  const rayId = req.headers['cf-ray'] || 'Unavailable';
  res.status(404).json({
    success: false,
    message: `ERROR: NO ROUTER FOUND, RAY ID: ${rayId}`,
  });
});

module.exports = router;