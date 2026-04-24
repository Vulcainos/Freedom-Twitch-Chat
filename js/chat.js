/**
 * Parse un message Twitch et remplace les emotes par des images
 * Code volé de la DA de bipeo mais j'ai changé le simple texte par des span
 * 
 * @param {string} message le texte du message
 * @param {object} emotes les emotes du message
 * @returns {HTMLElement|DocumentFragment} html pour le texte du message
 */
function parseMessage(message, emotes) {
  if (!emotes) { //simple message sans emotes, hop vers la sortie
    const span = document.createElement("span");
    span.append(message);
    return span;
  }

  const replacements = [];
  for (const [emoteId, positions] of Object.entries(emotes)) {
    for (const pos of positions) {
      const [start, end] = pos.split("-").map(Number);
      replacements.push({ start, end, emoteId });
    }
  }
  replacements.sort((a, b) => a.start - b.start);

  const fragment = document.createDocumentFragment();
  let cursor = 0;

  for (const { start, end, emoteId } of replacements) {
    if (cursor < start) {
      const span = document.createElement("span");
      span.appendChild(document.createTextNode(message.slice(cursor, start)));
      fragment.appendChild(span);
    }
    const img = document.createElement("img");
    img.src = `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/2.0`;
    img.alt = message.slice(start, end + 1);
    img.className = "emote";
    fragment.appendChild(img);
    cursor = end + 1;
  }

  if (cursor < message.length) {
    const span = document.createElement("span");
    span.appendChild(document.createTextNode(message.slice(cursor)));
    fragment.appendChild(span);
  }

  return fragment;
}

/**
 * Anime les bulles pour qu'elle bouge et ne ce tp pas à la position
 * 
 * @param {HTMLElement[]} bubbles les bulles d'avant
 * @param {DOMRect[]} firstRects les positions initiales des bulles
 */
function animateExistingBubbles(bubbles, firstRects) {
  // TODO à faire gaffe si y'a 10000 messages comment ça réagis
  // pour faire l'animation etou
  bubbles.forEach((bubble, i) => {
    const lastRect = bubble.getBoundingClientRect();
    const dy = firstRects[i].top - lastRect.top;
    bubble.animate(
      { transform: [`translateY(${dy}px)`, "translateY(0)"] },
      { duration: 300, easing: "ease" },
    );
  });
}

/**
 * Attent la disparition du messages
 *
 * @param {HTMLElement} bubble la bulle (Bah ouai logique)
 */
async function handleBubbleLifecycle(bubble) {
  if (CONFIG.chat.disappearDelay != -1) {
    await wait(CONFIG.chat.disappearDelay);
    await removeBubble(bubble).catch((err) =>
      console.error("Erreur lors de la suppression d'une bulle :", err),
    );
  }

}

/**
 * Crée une bulle de chat classique (avec pseudo et badges)
 *
 * @param {HTMLElement} chatContainer le conteneur du chat
 * @param {string} message le texte du message
 * @param {object} tags les tags IRC du message
 */
async function createChatBubble(chatContainer, message, tags) {
  const existingBubbles = [...chatContainer.querySelectorAll(".bubble")]; // TOujours à voire comment ça réagis quand y'a 10000 messages
  const firstRects = existingBubbles.map((b) => b.getBoundingClientRect());

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.setAttribute("data-position", CONFIG.chat.position);
  
  //Ajout les meta données du message (pour effacer les messages)
  bubble.setAttribute("data-msg-id", tags.id || "");
  bubble.setAttribute("data-user-id", tags["user-id"] || "");

  // pseudo (j'avoue c'est pas propre faut presque en faire une methode)
  const nameSpan = document.createElement("span");
  nameSpan.className = "display-name";
  nameSpan.style.color = tags.color || "black";
  nameSpan.style.borderColor = tags.color || "black";
  nameSpan.style.backgroundColor = tags.color ? `${tags.color}33` : "#ffffff33";
  bubble.setAttribute("data-style", CONFIG.style.bubbleStyle);
  if (CONFIG.style.bubbleStyle === "transparent") {
    nameSpan.style.color = tags.color || "black";
    nameSpan.style.borderColor = tags.color || "black";
    nameSpan.style.backgroundColor = "transparent";
  } else if (CONFIG.style.bubbleStyle === "trouble") {
    nameSpan.style.color = tags.color || "black";
    nameSpan.style.borderColor = tags.color || "black";
    nameSpan.style.backgroundColor = tags.color ? `${tags.color}33` : "#ffffff33";
  } else if (CONFIG.style.bubbleStyle === "opaque") {
    nameSpan.style.color = "black";
    nameSpan.style.borderColor = "black";
    nameSpan.style.backgroundColor = tags.color || "white";
  }

  await appendBadges(nameSpan, tags.badges);
  nameSpan.appendChild(document.createTextNode(tags["display-name"]));

  bubble.appendChild(nameSpan);
  bubble.appendChild(parseMessage(message, tags.emotes));
  chatContainer.appendChild(bubble);

  // Supprime les 10 premiers messages si on dépasse 100
  //WIP créer des petits lag j'ai l'impression, à revoir
  /*const allBubbles = chatContainer.querySelectorAll(".bubble");
  if (allBubbles.length > 100) {
    for (let i = 0; i < 10; i++) {
      allBubbles[i].remove();
    }
  }*/

  animateExistingBubbles(existingBubbles, firstRects);
  await handleBubbleLifecycle(bubble);
}


/**
 * Supprime une bulle proprement
 *
 * @param {HTMLElement} bubble la bulle à faire disparaitre
 */
async function removeBubble(bubble) {
  bubble.classList.add("bubble-out");
  // trouve l'animation qui se lance à l'ajout de la classe bubble-out
  const bubbleOutAnimation = bubble
    .getAnimations()
    .find(
      (animation) =>
        animation instanceof CSSAnimation &&
        animation.animationName === "pop-out",
    );
  // et attendre qu'elle se termine si elle existe
  await bubbleOutAnimation?.finished;
  bubble.remove();
}

/**
 * Permet d'attendre {@link ms} (en millisecondes)
 *
 * @param {number} ms temps à attendre en millisecondes
 * @returns {Promise<void>} une promesse qui se résout après {@link ms} millisecondes
 */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
