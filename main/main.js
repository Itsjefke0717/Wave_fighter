// COINS SHOW
let coins = parseInt(localStorage.getItem("coins") || "0", 10);

// Functie om grote getallen te formatteren naar een kortere notatie
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

function updateCoinDisplay() {
  document.getElementById("coinDisplay").innerHTML = `
<div style="display: flex; align-items: center; gap: 8px;">
<img src="../Fotos/icon/coins-pixel.png" style="width: 32px; height: 32px;">
<span style="vertical-align: middle;">${formatCoins(coins)}</span>
</div>
`;
}

window.onload = function () {
  updateCoinDisplay();
};

function showCredits() {
  const overlay = document.getElementById("creditsOverlay");
  overlay.style.display = "flex";
  setTimeout(() => {
    overlay.style.display = "none";
  }, 23000); // Overlay verdwijnt na 23 seconden
}

function hideCredits() {
  document.getElementById("creditsOverlay").style.display = "none";
}

// ADMIN MENU
// Select elements
const adminButton = document.getElementById("adminButton"); // FIXED: ID toegevoegd aan HTML
const adminOverlay = document.getElementById("adminOverlay");
const adminMenu = document.getElementById("adminMenu");
const saveChangesButton = document.getElementById("saveChanges");
const closeMenuButton = document.getElementById("closeMenu");
const siteTitleInput = document.getElementById("siteTitle");

// Admin password
const adminPassword = "1234";

// Show admin overlay after correct password
adminButton.addEventListener("click", () => {
  const password = prompt("Enter Admin Password:");
  if (password === adminPassword) {
    adminOverlay.classList.remove("hidden"); // Verwijdert 'hidden' klasse om overlay zichtbaar te maken
    alert("Welcome to the Admin Menu!");
  } else {
    alert("Incorrect Password!");
  }
});

// Save changes (e.g., change site title)
saveChangesButton.addEventListener("click", () => {
  const newCoins = parseInt(document.getElementById("changeCoins").value);
  if (!isNaN(newCoins)) {
    // Controleer of een geldig nummer is ingevoerd
    coins = newCoins; // Zet coins naar de nieuwe waarde
    localStorage.setItem("coins", coins); // Sla op in localStorage
    updateCoinDisplay(); // Werk het scherm bij
    alert(`Coins updated to: ${formatCoins(coins)}`);
  } else {
    alert("Please enter a valid number for coins.");
  }
});

// Close admin overlay
closeMenuButton.addEventListener("click", () => {
  adminOverlay.classList.add("hidden"); // Voegt 'hidden' klasse toe om overlay te verbergen
});


// Functie om karakter te kiezen
function selectCharacter(characterName) {
  localStorage.setItem("selectedCharacter", characterName); // Sla het gekozen karakter op
  alert(`You have selected: ${characterName}`); // Bevestigingsbericht
}

// Voeg event listeners toe aan de knoppen (zorg ervoor dat de ID's overeenkomen met de HTML)
document.getElementById("assassinButton").addEventListener("click", () => selectCharacter("assassin"));
document.getElementById("warriorButton").addEventListener("click", () => selectCharacter("warrior"));
document.getElementById("tankButton").addEventListener("click", () => selectCharacter("tank"));

// Haal de debug-status uit localStorage
let debug = localStorage.getItem('debug') === 'true';

// Stel de knoptekst in op basis van de huidige debug-status
const debugButton = document.getElementById('Debug');
debugButton.textContent = debug ? 'Click for Debug' : 'Debug ON';

// Event listener voor de debug-knop
debugButton.addEventListener('click', function() {
  // Toggle de debug-waarde
  debug = !debug;

  // Sla de nieuwe debug-status op in localStorage
  localStorage.setItem('debug', debug);

  // Pas de tekst van de knop aan
  debugButton.textContent = debug ? 'Debug is ON' : 'Debug is OFF';
});

