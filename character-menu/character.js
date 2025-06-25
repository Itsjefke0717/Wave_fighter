const config = {
  debugMode: localStorage.getItem("debugMode") === 'true' || true, // Haal de waarde op uit localStorage, standaard is true
  baseUpgradeCost: 10,
  upgradeIncrementFactor: 1.2, 
  upgradeIncrement: 112,
  healthIncreasePerUpgrade: 10,
  strengthIncreasePerUpgrade: 0,
};

// Laad de karakters uit localStorage
const characters = [
  {
    name: "warrior",
    health: 100,
    strength: 80,
    speed: 100,
    ability: "Warrior Boost",
    image: "../Fotos/characater_cards/warrior3.png",
    upgradeLevel: 0,
  },
  {
    name: "tank",
    health: 150,
    strength: 90,
    speed: 70,
    ability: "Blast",
    image: "../Fotos/characater_cards/tank3.png",
    upgradeLevel: 0,
  },
  {
    name: "assassin",
    health: 80,
    strength: 80,
    speed: 120,
    ability: "Critical Strike",
    image: "../Fotos/characater_cards/assassin3.png",
    upgradeLevel: 0,
  },
];

let currentIndex = 0;
let coins = localStorage.getItem("coins") ? parseInt(localStorage.getItem("coins")) : 0;

// Laad opgeslagen gegevens voor upgrades
characters.forEach(character => {
  const savedUpgradeLevel = localStorage.getItem(`upgradeLevel_${character.name}`);
  if (savedUpgradeLevel !== null) {
    character.upgradeLevel = parseInt(savedUpgradeLevel);
  }

  const savedHealth = localStorage.getItem(`health_${character.name}`);
  if (savedHealth !== null) {
    character.health = parseInt(savedHealth);
  }

  const savedStrength = localStorage.getItem(`strength_${character.name}`);
  if (savedStrength !== null) {
    character.strength = parseInt(savedStrength);
  }

  const savedSpeed = localStorage.getItem(`speed_${character.name}`);
  if (savedSpeed !== null) {
    character.speed = parseInt(savedSpeed);
  }
});

function logDebug(message) {
  if (config.debugMode) {
    console.log("[DEBUG]", message);
  }
}

const characterImage = document.getElementById("character-image");
const skillsDisplay = document.getElementById("skills-display");

let selectedCharacter = localStorage.getItem("selectedCharacter");

// Bepaal de kosten van een upgrade
function getUpgradeCost(character) {
  const baseCost = config.baseUpgradeCost;
  return Math.round(baseCost * Math.pow(config.upgradeIncrementFactor, character.upgradeLevel)); // Toepassen van de 1.2x factor
}

// Werk de eigenschappen van het karakter bij
function updateCharacter() {
  const character = characters[currentIndex];
  const upgradeCost = getUpgradeCost(character);
  document.getElementById("character-image").src = character.image;
  document.getElementById("skills-display").innerHTML = `
    <p><strong>Name:</strong> ${character.name}</p>
    <p><strong>Health:</strong> ${character.health}</p>
    <p><strong>Strength:</strong> ${character.strength}</p>
    <p><strong>Speed:</strong> ${character.speed}</p>
    <p><strong>Level:</strong> ${character.upgradeLevel}</p>
    <p><strong>Ability:</strong> ${character.ability}</strong></p>
        <button class="upgrade-btn">Upgrade (Cost: ${formatCoins(upgradeCost)} Coins)</button>
  `;
  document.querySelector(".upgrade-btn").addEventListener("click", () => upgradeHealth(character));
  logDebug(`Character updated: ${character.name}`);
}
// Upgrade de gezondheid van het karakter
function upgradeHealth(character) {
  const upgradeCost = getUpgradeCost(character);
  if (coins >= upgradeCost) {
    coins -= upgradeCost;
    character.upgradeLevel++;

    // Hier pas ik de health verhoging aan
    character.health += getRandomHealthIncrease(character.upgradeLevel);
    character.strength += config.strengthIncreasePerUpgrade;

    // Sla de gegevens op in localStorage
    localStorage.setItem("coins", coins);
    localStorage.setItem(`upgradeLevel_${character.name}`, character.upgradeLevel);
    localStorage.setItem(`health_${character.name}`, character.health);
    localStorage.setItem(`strength_${character.name}`, character.strength);

    showNotification(`Upgrade Successful! Level ${character.upgradeLevel}`, "success");
    updateCharacter(); // Werk het karakter bij op het scherm
    updateCoinDisplay(); // Werk het scherm met coins bij
  } else {
    showNotification("Not enough coins!", "error");
  }
}

// Functie voor willekeurige health verhoging afhankelijk van het level
function getRandomHealthIncrease(upgradeLevel) {
  let min = 1;
  let max = 20;

  // Als de upgradeLevel 10 of hoger is, veranderen we de health incremente
  if (upgradeLevel > 10 && upgradeLevel <= 50) {
    min = 20;
    max = 25;
  } else if (upgradeLevel > 50 && upgradeLevel <= 75) {
    min = 40;
    max = 60;
  } else if (upgradeLevel > 75) {
    min = 70;
    max = 80;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function navigate(direction) {
  if (direction === "prev") {
    currentIndex = (currentIndex - 1 + characters.length) % characters.length;
  } else if (direction === "next") {
    currentIndex = (currentIndex + 1) % characters.length;
  }
  updateCharacter();
}
// de coins die om gezet worden in afkortingen
function formatCoins(number) {
  if (number >= 1000000000) {
    return (number / 1000000000).toFixed(1).replace(".0", "") + "MLD"; // Voor miljarden
  } else if (number >= 1000000) {
    return (number / 1000000).toFixed(1).replace(".0", "") + "M"; // Voor miljoenen
  } else if (number >= 1000) {
    return (number / 1000).toFixed(1).replace(".0", "") + "K"; // Voor duizenden
  } else {
    return number.toString(); // Voor lagere hoeveelheden
  }
}
// display de coins op het scherm
function updateCoinDisplay() {
  document.getElementById("coinDisplay").innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <img src="../Fotos/icon/coins-pixel.png" style="width: 32px; height: 32px; z-index: 5;">
      <span>${formatCoins(coins)}</span>
    </div>
  `;
}
// laat de notification zien
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.classList.add("notification");

  if (type === "success") {
    notification.style.color = "#0ad406";
  } else if (type === "error") {
    notification.style.color = "red";
  }

  notification.innerHTML = `
    <i class="far ${type === "success" ? "fa-check-circle" : "fa-times-circle"} color"></i> &nbsp;
    <span>${message}</span>
  `;

  document.getElementById("notificationContainer").appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.5s forwards";
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 3000);
}
// de select voor de character
document.getElementById("Select").addEventListener("click", () => {
  const character = characters[currentIndex];
  localStorage.setItem("selectedCharacter", character.name); 
  selectedCharacter = character.name; 
  showNotification(`You selected: ${character.name}`, "success"); 
});


// herlaad de pagina en dit doet hij
window.onload = function () {
  if (selectedCharacter) {
    currentIndex = characters.findIndex(character => character.name === selectedCharacter);
  }
  updateCoinDisplay();
  updateCharacter();
  logDebug("Page loaded and character initialized");
};
// de buttons om van character te wisselen
document.getElementById("prev").addEventListener("click", () => navigate("prev"));
document.getElementById("next").addEventListener("click", () => navigate("next"));


//voor de synchroonsatie van de skills en button 
function updateButtonWidth() {
  let skillsBox = document.querySelector(".skills");
  let selectButton = document.querySelector("#Select");

  if (skillsBox && selectButton) {
      let newWidth = skillsBox.scrollWidth; // Bepaal de huidige breedte van .skills
      selectButton.style.width = newWidth + "px"; // Pas breedte van de knop aan
  }
}

// Voer de functie uit bij laden, bij resize, en als tekstinhoud verandert
window.addEventListener("load", updateButtonWidth);
window.addEventListener("resize", updateButtonWidth);

// Observeer veranderingen in de tekst en pas de breedte aan
const observer = new MutationObserver(updateButtonWidth);
observer.observe(document.querySelector(".skills"), { childList: true, subtree: true });
