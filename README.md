# Freedom Twitch Chat
Overlay Twitch pour afficher le chat sur son stream sans dépendre de personne ni d'aucun service.

Projet repris de https://github.com/Bipeo-dev/chat-bubble-overlay


## Fonctionnalités
- Aucune dépendance, une fois le fichier chargé sur OBS, fonctionne de lui-même
- Personnalisable simplement, que ce soit en termes de position, de taille et de couleur. Aucune compétence de codage requise
- Supporte les emotes Twitch, fixe et animées
- Supporte les badges Twitch mais requit une authentification.
- +1000 aura (c'est quoi ce pain les djeunes)


## Installation OBS
- Extraire l'archive de l'overlay dans le dossier de votre choix
- Sur OBS, ajouter une nouvelle source navigateur, en fichier local, et sélectionnez le fichier `index.html`
- Mettre en longueur et largeur de fenêtre ce que vous souhaitez
- Laisser le code css de base
- Voila !


## Configuration
> La configuration se fait à l'intérieur du projet, il suffit de **renommer** le fichier `config.js.example` en `config.js` localisé dans le dossier `js` et d'en modifier le contenu
> Le fichier de configuration peut s'ouvrir avec n'importe quel éditeur de texte, **un simple bloc note est suffisant**

<details>
<summary>Exemple de configuration :</summary>

```js
const CONFIG = {
  // Indiquer le pseudo Twitch de sa chaine (par exemple "bipeo", ou "vulcainos", ou autre)
  channel: "nomdechainetwitch",

  // Option twitch. Nécessaire pour avoir les badges. Pas besoin pour les emotes
  twitch: {
    // Activer les badges des utilisateurs (nécessite clientId et clientSecret)
    badges: false,
    // Client-ID de votre application Twitch (https://dev.twitch.tv/console/apps)
    clientId: "",
    // Client Secret de votre application Twitch
    clientSecret: "",
  },

  // Options de style :
  // Les couleurs acceptent le mots clés, couleur hexadécimale rgb au format rgb(255,255,255) et rgba (transparence) format rgba(255,255,255,1)
  // Les arrondis et épaisseur de bordure peuvent être défini pour tous ou unitairement. "10px" donnera 10px à chaque coin, "0px 6px 16px 10px" donnera des arrondis à chaque coin différent dans l'ordre "hautGauche hautDroit basDroit hautDroit"
  style: {
    // Style de la bulle, accepte seulement deux valeurs : transparent | trouble | opaque
    bubbleStyle: "opaque",
    // Couleur du texte des bulles de chat
    textColor: "#2061B6",
    // Couleur du fond des bulles de chat
    backgroundColor: "#cde3ff",
    // Rondeur de bordure, plus la valeur est élevée, plus la rondeur est intense
    borderRadius: "10px",
    // Épaisseur de la bordure, plus la valeur est élevée, plus la bordure est épaisse : 0px pour aucune bordure
    borderWidth: "2px",
    // Épaisseur de la bordure du pseudo, plus la valeur est élevée, plus la bordure est épaisse : 0px pour aucune bordure
    displayNameBorderWidth: "2px",
    // Rondeur de la bordure du pseudo, plus la valeur est élevée, plus la rondeur est intense
    displayNameBorderRadius: "2px 8px",
    // Espace en hauteur entre le pseudo et la bulle de chat (valeur en plus ou moins)
    displayNameGap: "4px",
    // Taille de la police
    fontSize: "18px",
  },

  // Options de message :
  chat: {
    // Position d'apparition du chat, accepte seulement deux valeurs : "haut" | "bas"
    apparition: "bas",
    // Position des bulles de chat, accepte seulement trois valeurs : "gauche" | "droite" | "centre"
    position: "gauche",

    // Delais en ms avant qu'un message disparaît
    // Si vous mettez -1, le message ne disparaîtra jamais
    disappearDelay: 8000,
  },
};
```

</details>


## Autres trucs
- Un grand merci à [Bipeo](https://github.com/Bipeo-dev) d'avoir démarrer le projet et l'idée
  - Son [Twitch](https://www.twitch.tv/bipeo)
  - Son [Twitter](https://x.com/Bipeo_dev) et [BlueSky](https://bsky.app/profile/bipeo.bsky.social)
- Si vous avez des questions hésitez pas à rejoindre mon [discord](https://discord.gg/wPVPTbXUFP)
- N'hésitez pas à check mon [twitch](https://www.twitch.tv/vulcainos) !
- Pour tout ajout de fonctionnalité :
  - Vous pouvez la dev vous-même et faire une PR
  - Créer un ticket github et peut-être un dev sera un nerd
- Bon stream et amusez vous !