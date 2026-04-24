const chatContainer = document.querySelector(".chat"); // Je garde le miaou

// Gere si chat apparait en haut ou en bas (par defaut en haut)
if (CONFIG.chat.apparition == "bas") {
  chatContainer.style.justifyContent = "flex-end";
}

// injection des styles depuis la config
const style = document.documentElement.style;style.setProperty("--text-color", CONFIG.style.textColor);
style.setProperty("--border-radius", CONFIG.style.borderRadius);
style.setProperty("--font-size", CONFIG.style.fontSize);
style.setProperty("--border-width", CONFIG.style.borderWidth);
style.setProperty("--display-name-border-width", CONFIG.style.displayNameBorderWidth);
style.setProperty("--display-name-border-radius", CONFIG.style.displayNameBorderRadius);
style.setProperty("--display-name-gap", CONFIG.style.displayNameGap);
// Ajout par rapport au style 
if (CONFIG.style.bubbleStyle == "transparent") {
  style.setProperty("--bubble-color", "transparent");
} else if (CONFIG.style.bubbleStyle == "trouble") {
  style.setProperty("--bubble-color", CONFIG.style.backgroundColor ? `${CONFIG.style.backgroundColor}8a` : "#ffffff8a");
} else if (CONFIG.style.bubbleStyle == "opaque") {
  style.setProperty("--bubble-color", CONFIG.style.backgroundColor);
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


if (CONFIG.isTestMode) {
  startTestMode();
} else {
    
  // connexion au chat Twitch
  const client = new tmi.Client({
    channels: [CONFIG.channel],
  });

  client.connect();

  client.on("message", async (_channel, tags, message, self) => {
    //console.log("Nouveau message :", { channel: _channel, tags, message, self });
    if (self) return;

    createChatBubble(chatContainer, message, tags);
  });

  // Suppression d'un message spécifique
  client.on("messagedeleted", (_channel, _username, _deletedMessage, tags) => {
    const msgId = tags["target-msg-id"];
    if (msgId) {
      const bubble = chatContainer.querySelector(`.bubble[data-msg-id="${msgId}"]`);
      if (bubble) removeBubble(bubble);
    }
  });

  // Timeout : supprime tous les messages de l'utilisateur
  client.on("timeout", (_channel, username, _reason, _duration, tags) => {
    const userId = tags["target-user-id"];
    if (userId) {
      chatContainer.querySelectorAll(`.bubble[data-user-id="${userId}"]`).forEach(removeBubble);
    }
  });

  // Ban : supprime tous les messages de l'utilisateur
  client.on("ban", (_channel, username, _reason, tags) => {
    const userId = tags["target-user-id"];
    if (userId) {
      chatContainer.querySelectorAll(`.bubble[data-user-id="${userId}"]`).forEach(removeBubble);
    }
  });

  // Clear chat : supprime tous les messages (l'option de twitch dans le pannel de stream)
  client.on("clearchat", () => {
    chatContainer.querySelectorAll(".bubble").forEach(removeBubble);
  });
}

// Mode de test, ça envoie un messages toutes les 1 à 3 secondes avec un texte random
function startTestMode() {
  const sampleUsers = [
    { name: "Le_spectateur_a_grand_nom", color: "#ff0000", badge: {"10-years-as-twitch-staff": "1", "sub-gifter": "2000", "the-golden-predictor-of-the-game-awards-2023": "1"} },
    { name: "Vulcainos", color: "#00ff00", badge: {"broadcaster": "1", "ditto": "1"} },
    { name: "Bipeo", color: "#0000ff" },
    { name: "Alan_Tuning", color: "#f7b731" },
    { name: "Le_bot_du_chat", color: "#a55eea", badge: {"twitchbot": "1","twitchbot": "2"} },
    { name: "Salted", color: "#2dc59f", badge: {"bits": "500000"} },
  ];

  const sampleMessages = [
    "Salut et bienvenue dans la météo du chat !",
    "Omg l'overlay la kappa",
    "On est dans le mode test la ou quoi?",
    "vulcai3Zinzin zinzin de fou le truc",
    "!clip",
    "Mur de LUL dans le chat LUL LUL LUL LUL LUL ",
    "OMG ce messages est très gros pour tester les gros messages sur twitch et que si ça rentre bien dans l'espace et que ça fait pas n'importe quoi en terme de mise en page et que ça reste lisible et que ça dépasse pas",
    "Olalalala l'enchainement !",
  ];

  const emitTestMessage = () => {
    const user = sampleUsers[randomBetween(0, sampleUsers.length - 1)];
    const message = sampleMessages[randomBetween(0, sampleMessages.length - 1)];
    const id = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    createChatBubble(chatContainer, message, {
      id,
      "user-id": user.name.toLowerCase(),
      "display-name": user.name,
      color: user.color,
      badges: user.badge ?? null,
      emotes: null,//Normalement faut avoir les emotes dans les tags mais flemme en vrai (promis ça fonctionne)
    });

    setTimeout(emitTestMessage, randomBetween(1000, 3000));
  };

  emitTestMessage();
}