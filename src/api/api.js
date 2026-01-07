const express = require('express');
const router = express.Router();
const Users = require('../database');
const {sendEmail,readDatabase,writeDatabase} = require('../emailsender');
const multer = require('multer')
const path = require('path')
require('dotenv').config();


const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

router.get('/api/search', async (req, res) => {
    const searchTerm = (req.query.q || '').toLowerCase();
    if (!searchTerm) return res.json([]);
    const db = await readDatabase();
    const results = db.ads.filter(ad => ad.productName.toLowerCase().includes(searchTerm));
    res.status(200).json(results);
});

router.get('/api/search-users', async (req, res) => {
    const searchTerm = (req.query.q || '').toLowerCase();
    if (!searchTerm) return res.json([]);
    const db = await readDatabase();
    const results = db.users.filter(user => user.username.toLowerCase().includes(searchTerm)).map(user => ({ username: user.username, profilePicture: user.profilePicture }));
    res.status(200).json(results);
});

router.get('/api/ad/:id', async (req, res) => {
    const adId = parseInt(req.params.id, 10);
    const db = await readDatabase();
    const ad = db.ads.find(a => a.id === adId);
    if (ad) {
        res.status(200).json(ad);
    } else {
        res.status(404).json({ message: 'A hirdetés nem található!' });
    }
});

router.get('/api/user/profile-picture/:username', async (req, res) => {
    const { username } = req.params;
    const user = await Users.findOne({ username: username });
    if (user && user.picture) {
        res.status(200).json({ profilePicture: user.picture });
    } else {
        res.status(404).json({ message: 'Felhasználó vagy profilkép nem található!' });
    }
});

router.post('/delete-btn', async (req, res) => {
    const loggedin = req.body.loggedin;
    if (!loggedin) return res.status(400).json({ message: 'Nem lett felhasználónév megadva.' });
    try {
        console.log('Delete request for user:', loggedin);
        const deleted = await Users.findOneAndDelete({ username: loggedin });
        console.log('Delete result:', deleted);
        if (!deleted) return res.status(404).json({ message: 'Felhasználó nem található.' });
        return res.status(200).json({ message: 'Felhasználó sikeresen törölve!' });
    } catch (err) {
        console.error('Delete user error:', err);
        return res.status(500).json({ message: 'Szerverhiba történt a felhasználó törlésekor.' });
    }

});

router.post('/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
    if (!req.file) { return res.status(400).json({ message: 'Nem lett fájl kiválasztva!' }); }
    const { username } = req.body;
    const filePath = `/uploads/${req.file.filename}`;
    try {
        await Users.findOneAndUpdate(
            { username: username },
            { $set: { picture: filePath } },
            { new: true }
        );
        res.status(200).json({ filePath });
    } catch (error) {
        res.status(500).json({ message: 'Hiba történt a kép mentésekor!' });
    }
});

router.post('/create-ad', upload.single('productImage'), async (req, res) => {
    if (!req.file) { return res.status(400).json({ message: 'Kép feltöltése kötelező!' }); }
    const { productName, price, description, location, author } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;
    const db = await readDatabase();
    const newAd = { id: Date.now(), productName, price, description, location, imageUrl, author };
    db.ads.push(newAd);
    await writeDatabase(db);
    const authorData = db.users.find(u => u.username === author);
    if (authorData) {
        await sendEmail(authorData.email, 'Sikeres termékfeltöltés!', `Szia ${author}! A termékedet "${productName}" néven sikeresen meghirdetted a Piactéren.`);
    }
    res.status(201).json({ message: 'Termék sikeresen meghirdetve!' });
});

router.get('/api/user-ads/:username', async (req, res) => {
    const { username } = req.params;
    const db = await readDatabase();
    const userAds = db.ads.filter(ad => ad.author === username);
    res.status(200).json(userAds);
});

router.get('/api/all-ads', async (req, res) => {
    const db = await readDatabase();
    res.status(200).json(db.ads.reverse());
});

router.delete('/delete-ad/:id', async (req, res) => {
    const adId = parseInt(req.params.id, 10);
    const db = await readDatabase();
    const newAds = db.ads.filter(ad => ad.id !== adId);
    if (db.ads.length === newAds.length) {
        return res.status(404).json({ message: 'A hirdetés nem található!' });
    }
    db.ads = newAds;
    await writeDatabase(db);
    res.status(200).json({ message: 'Hirdetés sikeresen törölve!' });
});

router.get('/api/users/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const email = await Users.aggregate([
        { $match: { username: username } },
        { $project: { _id: 0, email: 1 } }
    ])
      res.status(202).json({ message: `${username}`, email: email[0].email });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});




router.post('/send-message', async (req, res) => {
    const { fromUser, toUser, message } = req.body;
    const db = await readDatabase();
    db.messages.push({ id: Date.now(), fromUser, toUser, message, timestamp: Date.now(), isRead: false });
    await writeDatabase(db);
    res.status(201).json({ message: 'Üzenet elküldve!' });
});

router.get('/api/conversations/:username', async (req, res) => {
    const { username } = req.params;
    const db = await readDatabase();
    const relatedMessages = db.messages.filter(m => m.fromUser === username || m.toUser === username);
    const conversations = {};
    relatedMessages.forEach(msg => {
        const partner = msg.fromUser === username ? msg.toUser : msg.fromUser;
        if (!partner) return;
        if (!conversations[partner]) {
            const partnerData = db.users.find(u => u.username === partner);
            conversations[partner] = { partnerName: partner, partnerAvatar: partnerData ? partnerData.profilePicture : null, messages: [], unreadCount: 0 };
        }
        conversations[partner].messages.push(msg);
        if (msg.toUser === username && !msg.isRead) {
            conversations[partner].unreadCount++;
        }
    });
    const result = Object.values(conversations).map(convo => {
        const lastMessage = convo.messages.sort((a, b) => b.timestamp - a.timestamp)[0];
        if (!lastMessage) return null;
        return { partnerName: convo.partnerName, partnerAvatar: convo.partnerAvatar, lastMessage: lastMessage.message, lastMessageTimestamp: lastMessage.timestamp, lastMessageFromMe: lastMessage.fromUser === username, unreadCount: convo.unreadCount };
    }).filter(Boolean);
    res.status(200).json(result.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp));
});

router.get('/api/messages/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;
    const db = await readDatabase();
    const conversation = db.messages.filter(m => (m.fromUser === user1 && m.toUser === user2) || (m.fromUser === user2 && m.toUser === user1)).sort((a, b) => a.timestamp - b.timestamp);
    res.status(200).json(conversation);
});

router.get('/api/unread-conversations-count/:username', async (req, res) => {
    const { username } = req.params;
    const db = await readDatabase();
    const unreadSenders = new Set();
    db.messages.forEach(msg => {
        if (msg.toUser === username && !msg.isRead) {
            unreadSenders.add(msg.fromUser);
        }
    });
    res.status(200).json({ count: unreadSenders.size });
});

router.post('/mark-messages-as-read', async (req, res) => {
    const { loggedInUser, partner } = req.body;
    const db = await readDatabase();
    let changed = false;
    db.messages.forEach(msg => {
        if (msg.toUser === loggedInUser && msg.fromUser === partner && !msg.isRead) {
            msg.isRead = true;
            changed = true;
        }
    });
    if (changed) {
        await writeDatabase(db);
    }
    res.status(200).json({ message: 'Üzenetek olvasottá téve.' });
});

module.exports = router;