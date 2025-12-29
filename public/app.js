

document.addEventListener("DOMContentLoaded", () => {
  const loggedInUser = sessionStorage.getItem("loggedInUser");
  updateNav(loggedInUser);

  // Oldalspecifikus funkciók futtatása
  if (document.getElementById("all-ads-container")) {
    loadAllAds();
  }
  if (document.getElementById("search-results-page")) {
    loadSearchResults();
  }
  if (document.getElementById("user-search-results-page")) {
    loadUserSearchResults();
  }
  if (document.getElementById("profile-page")) {
    loadProfilePage(loggedInUser);
  }
  if (document.getElementById("new-ad-form")) {
    setupNewAdForm(loggedInUser);
  }
  if (document.getElementById("register-form")) {
    setupRegisterForm();
  }
  if (document.getElementById("login-form")) {
    setupLoginForm();
  }
  if (document.getElementById("ad-details-page")) {
    loadAdDetails(loggedInUser);
  }
  if (document.querySelector(".chat-container")) {
    loadChat(loggedInUser);
  }




document.documentElement.style.scrollBehavior = "smooth"; 
  // A kereső form most már a megfelelő oldalra irányít
  const searchForm = document.getElementById("search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = document.getElementById("search-input").value;
      // Alapértelmezetten termékekre keresünk, kivéve ha a felhasználó kereső oldalon vagyunk
      if (document.getElementById("user-search-results-page")) {
        window.location.href = `/user-search-results.html?q=${encodeURIComponent(
          query
        )}`;
      } else {
        window.location.href = `/search-results.html?q=${encodeURIComponent(
          query
        )}`;
      }
    });
  }

  // Carousel logic (auto-advance, pause on hover, touch swipe)
  const carousel = document.getElementById("carousel");
  const carouselImgs = document.querySelectorAll(".carousel-img");
  let currentIndex = 0;
  const leftBtn = document.getElementById("carousel-left");
  const rightBtn = document.getElementById("carousel-right");
  const AUTO_INTERVAL_MS = 4000; // change to adjust speed
  let autoTimer = null;
  let isPaused = false; // pause while hovered or when user interacts

  function showImage(index) {
    if (!carouselImgs || carouselImgs.length === 0) return;
    currentIndex =
      ((index % carouselImgs.length) + carouselImgs.length) %
      carouselImgs.length;
    carouselImgs.forEach((img, i) => {
      img.style.display = i === currentIndex ? "block" : "none";
    });
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(() => {
      if (!isPaused) {
        currentIndex = (currentIndex + 1) % carouselImgs.length;
        showImage(currentIndex);
      }
    }, AUTO_INTERVAL_MS);
  }

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  if (carouselImgs.length > 0) {
    // show first image initially
    showImage(0);

    // arrow buttons
    if (leftBtn) {
      leftBtn.addEventListener("click", () => {
        currentIndex =
          (currentIndex - 1 + carouselImgs.length) % carouselImgs.length;
        showImage(currentIndex);
        // briefly pause auto-advance after manual interaction
        isPaused = true;
        setTimeout(() => {
          isPaused = false;
        }, 1200);
      });
    }
    if (rightBtn) {
      rightBtn.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % carouselImgs.length;
        showImage(currentIndex);
        isPaused = true;
        setTimeout(() => {
          isPaused = false;
        }, 1200);
      });
    }

    // pause on hover (desktop)
    if (carousel) {
      carousel.addEventListener("mouseenter", () => {
        isPaused = true;
      });
      carousel.addEventListener("mouseleave", () => {
        isPaused = false;
      });

      // basic touch swipe support (mobile)
      let touchStartX = 0;
      let touchEndX = 0;
      carousel.addEventListener(
        "touchstart",
        (e) => {
          touchStartX = e.changedTouches[0].clientX;
          isPaused = true; // stop auto while swiping
        },
        { passive: true }
      );
      carousel.addEventListener(
        "touchmove",
        (e) => {
          touchEndX = e.changedTouches[0].clientX;
        },
        { passive: true }
      );
      carousel.addEventListener(
        "touchend",
        (e) => {
          touchEndX = touchEndX || e.changedTouches[0].clientX;
          const dx = touchEndX - touchStartX;
          if (Math.abs(dx) > 40) {
            if (dx < 0) {
              currentIndex = (currentIndex + 1) % carouselImgs.length;
            } else {
              currentIndex =
                (currentIndex - 1 + carouselImgs.length) % carouselImgs.length;
            }
            showImage(currentIndex);
          }
          // resume after short delay
          setTimeout(() => {
            isPaused = false;
            touchStartX = 0;
            touchEndX = 0;
          }, 600);
        },
        { passive: true }
      );
    }

    // pause when tab is hidden to save CPU/battery
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAuto();
      else startAuto();
    });

    // start auto-advance
    startAuto();
  }
});

// --- FŐ FUNKCIÓK ÉS SEGÉDFÜGGVÉNYEK ---

function updateNav(username) {
  const userNav = document.getElementById("user-nav");
  if (!userNav) return;
  if (username) {
    userNav.innerHTML = `<a href="/profile.html" class="nav-username">Profilom</a><div class="nav-username-container"><a href="/chat.html" class="nav-username">Üzenetek</a><span id="nav-unread-badge" style="display: none;"></span></div><button id="logout-button" class="btn-logout">Kijelentkezés</button>`;
    document.getElementById("logout-button").addEventListener("click", () => {
      sessionStorage.removeItem("loggedInUser");
      window.location.href = "/";
    });
    updateUnreadBadge(username);
  } else {
    userNav.innerHTML = `<ul><li><a href="/login.html" class="btn-login">Bejelentkezés</a></li><li><a href="/register.html" class="btn-register">Regisztráció</a></li></ul>`;
  }
}

async function updateUnreadBadge(username) {
  const badge = document.getElementById("nav-unread-badge");
  if (!badge || !username) return;
  try {
    const res = await fetch(`/api/unread-conversations-count/${username}`);
    const data = await res.json();
    if (data.count > 0) {
      badge.textContent = data.count;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  } catch (error) {
    console.error("Hiba az olvasatlan üzenetek számának lekérésekor:", error);
  }
}

async function loadAllAds() {
  const container = document.getElementById("all-ads-container");
  const response = await fetch("/api/all-ads");
  const ads = await response.json();
  if (ads.length === 0) {
    container.innerHTML = "<p>Jelenleg nincsenek aktív hirdetések.</p>";
    return;
  }
  container.innerHTML = ads
    .map(
      (ad) => `
        <a href="/ad-details.html?id=${ad.id}" class="ad-card-link" style="text-decoration: none; color: inherit;">
            <div class="ad-card"><img src="${ad.imageUrl}" alt="${ad.productName}"><div class="ad-card-info"><h3>${ad.productName}</h3><p class="ad-price">${ad.price} Ft</p><p class="ad-location">${ad.location}</p><p class="ad-author">Készítő: ${ad.author}</p></div></div>
        </a>`
    )
    .join("");
}

async function loadSearchResults() {
  const container = document.getElementById("search-results-container");
  const summaryEl = document.getElementById("results-summary");
  const titleEl = document.querySelector(".search-header-box h1");
  const query = new URLSearchParams(window.location.search).get("q");
  const searchInput = document.getElementById("search-input");
  if (searchInput && query) {
    searchInput.value = query;
  }

  // JAVÍTÁS: Ellenőrizzük, hogy a gomb létezik-e, mielőtt eseményfigyelőt adnánk hozzá
  const userSearchBtn = document.getElementById("user-search-btn");
  if (userSearchBtn) {
    userSearchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const currentQuery = document.getElementById("search-input").value;
      window.location.href = `/user-search-results.html?q=${encodeURIComponent(
        currentQuery
      )}`;
    });
  }

  if (!query) {
    titleEl.textContent = "Keresés";
    summaryEl.textContent = "Írj be valamit a keresőmezőbe a fejlécben!";
    container.innerHTML = "";
    return;
  }
  titleEl.textContent = `Találatok erre: "${query}"`;
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const results = await response.json();
    summaryEl.textContent = `Találatok száma: ${results.length}`;
    if (results.length === 0) {
      container.innerHTML =
        '<p style="padding: 2rem; text-align: center;">Sajnos nincs ilyen találat.</p>';
      return;
    }
    container.innerHTML = results
      .map(
        (ad) => `
            <a href="/ad-details.html?id=${ad.id}" class="result-card">
                <img src="${ad.imageUrl}" alt="${
          ad.productName
        }" class="result-card-img">
                <div class="result-card-info"><h3>${
                  ad.productName
                }</h3><p class="price">${
          ad.price
        } Ft</p><p class="description-snippet">${ad.description.substring(
          0,
          150
        )}...</p></div>
            </a>`
      )
      .join("");
  } catch (error) {
    summaryEl.textContent = "Hiba a keresés során.";
    console.error("Hiba a keresés során:", error);
  }
}

async function loadUserSearchResults() {
  const container = document.getElementById("user-results-container");
  const summaryEl = document.getElementById("results-summary");
  const titleEl = document.querySelector(".search-header-box h1");
  const query = new URLSearchParams(window.location.search).get("q");
  const searchInput = document.getElementById("search-input");
  if (searchInput && query) {
    searchInput.value = query;
  }

  // JAVÍTÁS: Ellenőrizzük, hogy a gomb létezik-e
  const productSearchBtn = document.getElementById("product-search-btn");
  if (productSearchBtn) {
    productSearchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const currentQuery = document.getElementById("search-input").value;
      window.location.href = `/search-results.html?q=${encodeURIComponent(
        currentQuery
      )}`;
    });
  }

  if (!query) {
    titleEl.textContent = "Felhasználók keresése";
    summaryEl.textContent = "Írj be egy nevet a kereséshez!";
    container.innerHTML = "";
    return;
  }
  titleEl.textContent = `Találatok erre: "${query}"`;
  try {
    const response = await fetch(
      `/api/search-users?q=${encodeURIComponent(query)}`
    );
    const results = await response.json();
    summaryEl.textContent = `Találatok száma: ${results.length}`;
    if (results.length === 0) {
      container.innerHTML =
        '<p style="padding: 2rem; text-align: center;">Nincs ilyen felhasználó.</p>';
      return;
    }
    container.innerHTML = results
      .map((user) => {
        const avatar =
          user.profilePicture ||
          "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg";
        return `<a href="/profile.html?user=${user.username}" class="user-card"><img src="${avatar}" alt="${user.username}" class="user-card-avatar"><h3>${user.username}</h3></a>`;
      })
      .join("");
  } catch (error) {
    summaryEl.textContent = "Hiba a keresés során.";
  }
}



async function loadProfilePage(loggedInUser) {
  const profileUsername =
    new URLSearchParams(window.location.search).get("user") || loggedInUser;
   
  if (!profileUsername && !loggedInUser) {
    window.location.href = "/login.html";
    return;
  }
  const finalUsername = profileUsername || loggedInUser;
  loadProfileData(finalUsername, loggedInUser);
  loadUserAds(finalUsername);
}



async function loadProfileData(profileUsername, loggedInUser,email) {
  
  const profileImage = document.getElementById("profile-image");
  const imageUploadLabel = document.querySelector('label[for="image-upload"]');
  const buttonsContainer = document.getElementById("profile-action-buttons");
  const deleteUser = document.getElementById("delete-btn");
  try {
    fetch('/api/users/' + profileUsername)
        .then(res => res.json())
        .then(data => {
          document.getElementById("profile-username").textContent = data.message;
          document.getElementById("profile-email").textContent = data.email;
          
        })
        fetch('/api/user/profile-picture/' + profileUsername)
        .then(res => {
          if (!res.ok) throw new Error('Nincs profilkép');
          return res.json();
        })
        .then(data => {
          profileImage.src = data.profilePicture;
        })
        .catch(err => {
          profileImage.src = 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg';
        });
        
    
  
    if (loggedInUser === profileUsername) {
      if (imageUploadLabel) imageUploadLabel.style.display = "block";
    } else {
      if (imageUploadLabel) imageUploadLabel.style.display = "none";
      if (deleteUser) {
        deleteUser.style.display = "none";
        deleteUser.style.color = "black";
      }
      if (buttonsContainer)
        buttonsContainer.innerHTML = `<a href="/chat.html?with=${profileUsername}" class="send-message-btn">Üzenet küldése</a>`;
    }
    
  } catch (error) {
    console.error(error);
  }

if (deleteUser) {
  deleteUser.addEventListener("click", async () => {
    if (!confirm("Biztosan törölni szeretnéd a fiókodat? Ez a művelet visszafordíthatatlan.")) return;
    const response = await fetch("/delete-btn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loggedin: loggedInUser }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      alert(data.message || "Fiókod sikeresen törölve!");
      sessionStorage.removeItem("loggedInUser");
      window.location.href = "/login.html";
    } else {
      alert(data.message || "A törlés nem sikerült.");
    }
  });
}


  const imageUploadInput = document.getElementById("image-upload");
  if (imageUploadInput) {
    imageUploadInput.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("profilePicture", file);
      formData.append("username", loggedInUser);
      const response = await fetch("/upload-profile-picture", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        
        profileImage.src = formData.get("profilePicture")
          ? URL.createObjectURL(formData.get("profilePicture"))
          : profileImage.src;
        alert("Profilkép sikeresen feltöltve!");
      }
    });
  }
}

async function loadUserAds(username) {
  const container = document.getElementById("user-ads-container");
  if (!container) return;
  const response = await fetch(`/api/user-ads/${username}`);
  const ads = await response.json();
  container.innerHTML = "";
  if (ads.length === 0) {
    container.innerHTML =
      "<p>Ez a felhasználó még nem töltött fel terméket.</p>";
    return;
  }
  ads.forEach((ad) => {
    const adCard = document.createElement("div");
    adCard.className = "ad-card";
    let deleteButtonHtml = "";
    if (sessionStorage.getItem("loggedInUser") === username) {
      deleteButtonHtml = `<button class="ad-delete-btn" data-id="${ad.id}">Törlés</button>`;
    }
    adCard.innerHTML = `<a href="/ad-details.html?id=${ad.id}" class="ad-card-link" style="text-decoration: none; color: inherit; display: contents;"><img src="${ad.imageUrl}" alt="${ad.productName}"><div class="ad-card-info"><h3>${ad.productName}</h3><p class="ad-price">${ad.price} Ft</p><p class="ad-location">${ad.location}</p></div></a>${deleteButtonHtml}`;
    container.appendChild(adCard);
  });
  document.querySelectorAll(".ad-delete-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      if (!confirm("Biztosan törölni szeretnéd ezt a terméket?")) return;
      const adId = event.target.dataset.id;
      const response = await fetch(`/delete-ad/${adId}`, { method: "DELETE" });
      if (response.ok) {
        event.target.closest(".ad-card").remove();
      } else {
        alert("A törlés nem sikerült.");
      }
    });
  });
}

async function loadAdDetails(loggedInUser) {
  const container = document.getElementById("ad-details-page");
  const adId = new URLSearchParams(window.location.search).get("id");
  if (!adId) {
    container.innerHTML = "<h2>Hirdetés nem található.</h2>";
    return;
  }
  const response = await fetch(`/api/ad/${adId}`);
  if (!response.ok) {
    container.innerHTML = "<h2>Hirdetés betöltése sikertelen.</h2>";
    return;
  }
  const ad = await response.json();
  let chatButtonHtml = "";
  if (loggedInUser && loggedInUser !== ad.author) {
    chatButtonHtml = `<a href="/chat.html?with=${ad.author}" class="start-chat-btn">Csevegés az eladóval</a>`;
  } else if (loggedInUser && loggedInUser === ad.author) {
    chatButtonHtml = `<p>Ez a te saját hirdetésed.</p>`;
  } else if (!loggedInUser) {
    chatButtonHtml = `<p><a href="/login.html">Jelentkezz be</a> a csevegéshez!</p>`;
  }
  container.innerHTML = `<div class="ad-details-card"><div class="ad-details-image"><img src="${
    ad.imageUrl
  }" alt="${ad.productName}"></div><div class="ad-details-info"><h1>${
    ad.productName
  }</h1><p class="price">${
    ad.price
  } Ft</p><p class="author">Eladó: <a href="/profile.html?user=${ad.author}">${
    ad.author
  }</a></p><p class="location">Helyszín: ${
    ad.location
  }</p><h3>Leírás</h3><p class="description">${ad.description.replace(
    /\n/g,
    "<br>"
  )}</p>${chatButtonHtml}</div></div>`;
}

async function loadChat(loggedInUser) {
  if (!loggedInUser) {
    window.location.href = "/login.html";
    return;
  }
  const conversationListEl = document.getElementById("conversation-list");
  const chatHeaderEl = document.getElementById("chat-header");
  const chatMessagesEl = document.getElementById("chat-messages");
  const chatInputAreaEl = document.getElementById("chat-input-area");
  const messageInputEl = document.getElementById("chat-message-input");
  const sendMessageBtn = document.getElementById("send-message-btn");
  let currentPartner = new URLSearchParams(window.location.search).get("with");

  const renderConversations = async (activePartner) => {
    const res = await fetch(`/api/conversations/${loggedInUser}`);
    const conversations = await res.json();
    conversationListEl.innerHTML = "";
    if (conversations.length === 0) {
      conversationListEl.innerHTML = "<p>Nincsenek beszélgetéseid.</p>";
      return;
    }
    conversations.forEach((convo) => {
      const item = document.createElement("div");
      item.className = "conversation-item";
      if (convo.partnerName === activePartner) {
        item.classList.add("active");
      }
      const avatarSrc =
        convo.partnerAvatar ||
        "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg";
      const lastMessagePrefix = convo.lastMessageFromMe
        ? "<strong>Te:</strong> "
        : "";
      item.innerHTML = `<div class="conversation-avatar-container"><img src="${avatarSrc}" alt="${
        convo.partnerName
      }" class="conversation-avatar">${
        convo.unreadCount > 0
          ? `<span class="conversation-unread-badge">${convo.unreadCount}</span>`
          : ""
      }</div><div class="conversation-details"><strong class="partner-name">${
        convo.partnerName
      }</strong><div class="conversation-last-message">${lastMessagePrefix}${
        convo.lastMessage
      }</div></div>`;
      item.onclick = () => {
        window.history.pushState(
          {},
          "",
          `/chat.html?with=${convo.partnerName}`
        );
        renderChat(convo.partnerName);
      };
      conversationListEl.appendChild(item);
    });
  };
  const renderMessages = (messages) => {
    chatMessagesEl.innerHTML = "";
    messages.forEach((msg) => {
      const bubble = document.createElement("div");
      bubble.className = "message-bubble";
      bubble.classList.add(msg.fromUser === loggedInUser ? "sent" : "received");
      bubble.textContent = msg.message;
      chatMessagesEl.appendChild(bubble);
    });
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  };
  const renderChat = async (partner) => {
    if (!partner) return;
    currentPartner = partner;
    await renderConversations(partner);
    await fetch("/mark-messages-as-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loggedInUser, partner }),
    });
    updateUnreadBadge(loggedInUser);
    chatHeaderEl.textContent = `Beszélgetés vele: ${partner}`;
    chatInputAreaEl.style.display = "flex";
    const res = await fetch(`/api/messages/${loggedInUser}/${partner}`);
    const messages = await res.json();
    renderMessages(messages);
  };
  sendMessageBtn.addEventListener("click", async () => {
    const message = messageInputEl.value.trim();
    if (!message || !currentPartner) return;
    await fetch("/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromUser: loggedInUser,
        toUser: currentPartner,
        message,
      }),
    });
    messageInputEl.value = "";
    renderChat(currentPartner);
  });
  await renderConversations(currentPartner);
  if (currentPartner) {
    await renderChat(currentPartner);
  }
}

function setupNewAdForm(loggedInUser) {
  const form = document.getElementById("new-ad-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    formData.append("author", loggedInUser);
    const response = await fetch("/create-ad", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    alert(data.message);
    if (response.ok) {
      window.location.href = "/profile.html";
    }
  });
}
function setupRegisterForm() {
  const form = document.getElementById("register-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const response = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    alert(data.message);
    if (response.ok) {
      window.location.href = "/login.html";
    }
  });
}
function setupLoginForm() {
  const form = document.getElementById("login-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      sessionStorage.setItem("loggedInUser", data.username);
      window.location.href = "/";
    } else {
      alert(data.message);
    }
  });
}
