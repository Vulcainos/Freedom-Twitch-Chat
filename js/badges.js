const badgeMap = {};
let badgesFetched = false;

const BADGE_CACHE_KEY = "twitch_badge_cache";
const BADGE_CACHE_TTL = 180 * 24 * 60 * 60 * 1000; // 6 mois en ms (en année comptable)

const TOKEN_CACHE_KEY = "twitch_token_cache";
const TOKEN_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 1 mois en ms (aussi)

/**
 * Génère un token OAuth pour l'app Twitch. Utilisé pour les badges sinon pas possible de les récup
 * Pourquoi faire ça et pas avoir le Oauth directement ?? Et bien les Oauth sont à renouveller donc je trouve ça plus simple d'en refaire un ici et pas à la main
 *
 * @returns {Promise<string|null>} le token ou null
 */
async function generateToken() {
  if (!CONFIG.twitch.clientId || !CONFIG.twitch.clientSecret) {
    console.warn("Badge désactivé ou clientId/clientSecret manquant/erreur, impossible de générer un token.");
    return null;
  }
  /* 
    J'ai une vraie intérogation sur l'utilisation du token
    En pratique on peut faire avec un refresh token mais je sais pas comment obs va le gèrer ou si ça rend pas trop compliqué le proces
    Si ça vous dite : https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#implicit-grant-flow
  */
  const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CONFIG.twitch.clientId,
      client_secret: CONFIG.twitch.clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!tokenRes.ok) {
    console.error("Erreur génération token :", tokenRes.status, await tokenRes.text());
    return null;
  }
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

/**
 * Récupère un token OAuth depuis le cache localStorage ou en génère un nouveau.
 *
 * @returns {Promise<string|null>} le token ou null
 */
async function getCachedToken() {
  try {
    const cached = JSON.parse(localStorage.getItem(TOKEN_CACHE_KEY));
    if (cached && Date.now() - cached.timestamp < TOKEN_CACHE_TTL) {
      return cached.token;
    }
  } catch (_) {}

  const token = await generateToken();
  if (token) {
    try {
      localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify({
        token,
        timestamp: Date.now(),
      }));
    } catch (_) {}
  }
  return token;
}

/**
 * Parse la réponse de l'API Twitch badges et remplit le badgeMap
 *
 * @param {object[]} sets les sets de badges retournés par l'API
 */
function parseBadgeSets(sets) {
  for (const set of sets) {
    for (const version of set.versions) {
      badgeMap[`${set.set_id}/${version.id}`] = version.image_url_2x;
    }
  }
}

/**
 * Récu les badges globaux et de la chaîne depuis l'API Twitch Helix (praise the Helix).
 * Utilise le localStorage avant de get.
 */
async function fetchBadges() {
  if (!CONFIG.twitch.badges) return;
  if (badgesFetched) return;
  badgesFetched = true;

  if (!CONFIG.twitch.clientId || !CONFIG.twitch.clientSecret) {
    console.warn("clientId ou clientSecret manquant dans la config, les badges ne seront pas affichés.");
    return;
  }

  // vérifier le cache localStorage
  try {
    const cached = JSON.parse(localStorage.getItem(BADGE_CACHE_KEY));
    if ( // refresh des badges
      cached &&
      cached.channel === CONFIG.channel &&
      Date.now() - cached.timestamp < BADGE_CACHE_TTL &&
      Object.keys(cached.badges).length > 0
    ) {
      Object.assign(badgeMap, cached.badges);
      console.info(`Badges chargés depuis le cache localStorage (${Object.keys(badgeMap).length} badges)`);
      return; //Sortez moi de la
    }
  } catch (_) {}

  // récupérer un token (depuis le cache ou prend un nouveau)
  const accessToken = await getCachedToken();
  if (!accessToken) {
    badgesFetched = false;
    return;
  }

  const headers = {
    "Client-ID": CONFIG.twitch.clientId,
    "Authorization": `Bearer ${accessToken}`,
  };

  // badges globaux (genre brodcaster/modo/event/ect)
  try {
    const res = await fetch("https://api.twitch.tv/helix/chat/badges/global", { headers });
    if (!res.ok) {
      console.error("Erreur API badges globaux :", res.status, await res.text());
    } else {
      const data = await res.json();
      parseBadgeSets(data.data);
    }
  } catch (e) {
    console.error("Erreur lors de la récupération des badges globaux :", e);
  }

  // badges de la chaîne paramétrée (les badges d'abonements/bits custom)
  try {
    const userRes = await fetch(
      `https://api.twitch.tv/helix/users?login=${encodeURIComponent(CONFIG.channel)}`,
      { headers },
    );
    if (!userRes.ok) {
      console.error("Erreur API users :", userRes.status, await userRes.text());
    } else {
      const userData = await userRes.json();
      const userId = userData.data?.[0]?.id;
      if (userId) {
        const res = await fetch(
          `https://api.twitch.tv/helix/chat/badges?broadcaster_id=${userId}`,
          { headers },
        );
        if (!res.ok) {
          console.error("Erreur API badges chaîne :", res.status, await res.text());
        } else {
          const data = await res.json();
          parseBadgeSets(data.data);
        }
      }
    }
  } catch (e) {
    console.error("Erreur lors de la récupération des badges de la chaîne :", e);
  }

  console.info(`Badges récupérés : ${Object.keys(badgeMap).length} au total`);

  // sauvegarde dans le LocalStorage
  if (Object.keys(badgeMap).length > 0) {
    try {
      localStorage.setItem(BADGE_CACHE_KEY, JSON.stringify({
        channel: CONFIG.channel,
        timestamp: Date.now(),
        badges: badgeMap,
      }));
    } catch (_) {}
  } else {
    badgesFetched = false;
  }
}

/**
 * crée l'image HTML d'un badge dans un element HTML
 *
 * @param {HTMLElement} container l'élément parent (ou on ajoute)
 * @param {object} badges les badges du message (ex: { broadcaster: "1", subscriber: "0" })
 */
async function appendBadges(container, badges) {
  if (!CONFIG.twitch.badges || !badges) return;
  await fetchBadges();
  for (const [badgeName, badgeVersion] of Object.entries(badges)) {
    const badgeUrl = badgeMap[`${badgeName}/${badgeVersion}`];
    if (!badgeUrl) continue;
    const img = document.createElement("img");
    img.src = badgeUrl;
    img.alt = badgeName;
    img.className = "badge";
    container.appendChild(img);
  }
}
