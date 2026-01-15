const express = require("express");
const router = express.Router();
const { sendEmail, readDatabase, writeDatabase } = require("../emailsender");
const multer = require("multer");
const path = require("path");
const { Products_model } = require("../database");
const { Users_model } = require("../database");

require("dotenv").config();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

router.get("/api/search", async (req, res) => {
  const searchTerm = req.query.q || "";
  if (!searchTerm) return res.json([]);

  try {
    const results = await Products_model.find({
      productName: { $regex: searchTerm, $options: "i" },
    });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Hiba a keresés során!" });
  }
});

router.get("/api/search-users", async (req, res) => {
  const searchTerm = req.query.q || "";
  if (!searchTerm) return res.json([]);

  try {
    const results = await Users_model.find({
      username: { $regex: searchTerm, $options: "i" },
    }).select("username picture");

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Hiba a felhasználók keresésekor!" });
  }
});

router.get("/api/search-users", async (req, res) => {
  const searchTerm = (req.query.q || "").toLowerCase();
  if (!searchTerm) return res.json([]);
  const db = await readDatabase();
  const results = db.Users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm)
  ).map((user) => ({
    username: user.username,
    profilePicture: user.profilePicture,
  }));
  res.status(200).json(results);
});

router.get("/api/ad/:id", async (req, res) => {
  try {
    const adId = req.params.id;

    const ad = await Products_model.findOne({ id: Number(adId) });

    if (ad) {
      res.status(200).json(ad);
    } else {
      res.status(404).json({ message: "A hirdetés nem található!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Szerver hiba!" });
  }
});

router.get("/api/user/profile-picture/:username", async (req, res) => {
  try {
    const { username } = req.params;
    // JSON helyett a MongoDB modellben keressünk
    const user = await Users_model.findOne({ username: username });

    if (user && user.picture) {
      res.status(200).json({ profilePicture: user.picture });
    } else {
      res.status(404).json({ message: "Nincs profilkép a MongoDB-ben!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Szerver hiba!" });
  }
});

router.post("/delete-btn", async (req, res) => {
  const loggedin = req.body.loggedin;
  if (!loggedin)
    return res
      .status(400)
      .json({ message: "Nem lett felhasználónév megadva." });
  try {
    console.log("Delete request for user:", loggedin);
    const deleted = await Users_model.findOneAndDelete({ username: loggedin });
    console.log("Delete result:", deleted);
    if (!deleted)
      return res.status(404).json({ message: "Felhasználó nem található." });
    return res.status(200).json({ message: "Felhasználó sikeresen törölve!" });
  } catch (err) {
    console.error("Delete user error:", err);
    return res
      .status(500)
      .json({ message: "Szerverhiba történt a felhasználó törlésekor." });
  }
});

router.post(
  "/upload-profile-picture",
  upload.single("profilePicture"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "Nincs fájl!" });

    const { username } = req.body;
    const filePath = `/uploads/${req.file.filename}`;

    try {
      const result = await Users_model.findOneAndUpdate(
        { username: username },
        { $set: { picture: filePath } },
        { new: true }
      );

      if (!result)
        return res.status(404).json({ message: "Felhasználó nem található!" });
      res.status(200).json({ filePath });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Adatbázis hiba feltöltéskor!" });
    }
  }
);

router.post("/create-ad", upload.single("productImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Kép feltöltése kötelező!" });
    }

    const { productName, price, description, location, author } = req.body;

    const newProduct = new Products_model({
      id: Date.now(),
      productName,
      description,
      location,
      imageUrl: `/uploads/${req.file.filename}`,
      author: author || "Ismeretlen",
      price: Number(price),
    });

    await newProduct.save();

    res.status(201).json({ message: "Termék sikeresen feltotlve!" });
  } catch (error) {
    console.error("Szerver hiba:", error);
    res
      .status(500)
      .json({ message: "Hiba történt a mentés során!", error: error.message });
  }
});

router.get("/api/user-ads/:username", async (req, res) => {
  try {
    const username = req.params.username;

    const product = await Products_model.find({
      author: username,
    });
    console.log({ username, product });
    res.status(202).json({ message: `${username}`, product });
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get("/api/all-ads", async (req, res) => {
  try {
    const ads = await Products_model.find().sort({ _id: -1 });
    res.status(200).json(ads);
  } catch (error) {
    res.status(500).json({ message: "Hiba a hirdetések lekérésekor!" });
  }
});

router.delete("/delete-ad/:id", async (req, res) => {
  try {
    const adId = parseInt(req.params.id, 10);
    const result = await Products_model.findOneAndDelete({ id: adId });

    if (!result) {
      return res.status(404).json({ message: "A hirdetés nem található!" });
    }
    res.status(200).json({ message: "Hirdetés sikeresen törölve!" });
  } catch (error) {
    res.status(500).json({ message: "Hiba a törlés során!" });
  }
});
router.get("/api/users/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const email = await Users_model.aggregate([
      { $match: { username: username } },
      { $project: { _id: 0, email: 1 } },
    ]);
    res.status(202).json({ message: `${username}`, email: email[0].email });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/send-message", async (req, res) => {
  const { fromUser, toUser, message } = req.body;
  try {
    await Message_model.create({
      fromUser,
      toUser,
      message,
    });
    res.status(201).json({ message: "Üzenet elküldve!" });
  } catch (error) {
    res.status(500).json({ error: "Nem sikerült elküldeni az üzenetet." });
  }
});

router.get("/api/conversations/:username", async (req, res) => {
  const { username } = req.params;
  const db = await readDatabase();
  const relatedMessages = db.messages.filter(
    (m) => m.fromUser === username || m.toUser === username
  );
  const conversations = {};
  relatedMessages.forEach((msg) => {
    const partner = msg.fromUser === username ? msg.toUser : msg.fromUser;
    if (!partner) return;
    if (!conversations[partner]) {
      const partnerData = db.users.find((u) => u.username === partner);
      conversations[partner] = {
        partnerName: partner,
        partnerAvatar: partnerData ? partnerData.profilePicture : null,
        messages: [],
        unreadCount: 0,
      };
    }
    conversations[partner].messages.push(msg);
    if (msg.toUser === username && !msg.isRead) {
      conversations[partner].unreadCount++;
    }
  });
  const result = Object.values(conversations)
    .map((convo) => {
      const lastMessage = convo.messages.sort(
        (a, b) => b.timestamp - a.timestamp
      )[0];
      if (!lastMessage) return null;
      return {
        partnerName: convo.partnerName,
        partnerAvatar: convo.partnerAvatar,
        lastMessage: lastMessage.message,
        lastMessageTimestamp: lastMessage.timestamp,
        lastMessageFromMe: lastMessage.fromUser === username,
        unreadCount: convo.unreadCount,
      };
    })
    .filter(Boolean);
  res
    .status(200)
    .json(
      result.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp)
    );
});

router.get("/api/messages/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  const db = await readDatabase();
  const conversation = db.messages
    .filter(
      (m) =>
        (m.fromUser === user1 && m.toUser === user2) ||
        (m.fromUser === user2 && m.toUser === user1)
    )
    .sort((a, b) => a.timestamp - b.timestamp);
  res.status(200).json(conversation);
});

router.get("/api/unread-conversations-count/:username", async (req, res) => {
  const { username } = req.params;
  const db = await readDatabase();
  const unreadSenders = new Set();
  db.messages.forEach((msg) => {
    if (msg.toUser === username && !msg.isRead) {
      unreadSenders.add(msg.fromUser);
    }
  });
  res.status(200).json({ count: unreadSenders.size });
});

router.post("/mark-messages-as-read", async (req, res) => {
  const { loggedInUser, partner } = req.body;
  try {
    await Message_model.updateMany(
      { toUser: loggedInUser, fromUser: partner, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ message: "Üzenetek olvasottá téve." });
  } catch (error) {
    res.status(500).json({ error: "Hiba az állapot frissítésekor." });
  }
});

module.exports = router;
