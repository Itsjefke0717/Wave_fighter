function logDebug(message) {
  // Haal de debug-status uit localStorage
  const debug = localStorage.getItem('debug') === 'true';

  if (debug) {
    console.log("[DEBUG]: " + message);
  }
}

/////////////////////////// CONFIG //////////////////////
// General character configuraties
const characterConfig = {
  tank: {
    width: 300,
    height: 400,
    speed: 2,
    frameWidth: 128,
    frameHeight: 128,
    attackPower: 20,
    attackRange: 80,
    frameCount: 8,
    attackFrameCount: 10,
    attackAnimationSpeed: 15,
    hitbox: { x: 80, y: 50, width: 130, height: 160 },
    walkImageSrc: "../Fotos/paladin/Walk/spr_PaladinWalk_strip10.png",
    attackImageSrc: "../Fotos/paladin/Attack/spr_PaladinAttackWithoutEffect_strip41.png"
  },
  assassin: {
    width: 300,
    height: 400,
    speed: 4,
    frameWidth: 200,
    frameHeight: 200,
    attackPower: 25,
    attackRange: 50,
    frameCount: 8,
    attackFrameCount: 8,
    attackAnimationSpeed: 5,
    hitbox: { x: 80, y: 50, width: 130, height: 160 },
    walkImageSrc: "../Fotos/Martial Hero/Martial_Hero/Sprites/Run.png",
    attackImageSrc: "../Fotos/paladin/Attack/spr_PaladinAttackWithoutEffect_strip41.png"
  },
  warrior: {
    width: 320,
    height: 420,
    speed: 3,
    frameWidth: 170,
    frameHeight: 170,
    attackPower: 50,
    attackRange: 150,
    frameCount: 8,
    attackFrameCount: 8,
    attackAnimationSpeed: 16,
    hitbox: { x: 120, y: 90, width: 90, height: 120 },
    walkImageSrc: "../Fotos/sheets/spr_Walk_strip.png",
    attackImageSrc: "../Fotos/sheets/spr_Attack_strip.png"
  }
};
/////////////////////////// VARIBILES ///////////////////
let player;
let keys = {};
let keyStates = {}; // sla keys op
let savedSpeed = 0; 
let isGameOver = false; // boolean voor gameover
let camera = { x: 0, y: 0 };
let isPaused = false;
let enemies = [];
let wave = 1;
let enemyCount = 5;
let waveActive = true;
let attackCooldown = false;
let xp = 0;
let xpToLevelUp = 100;
let level = 1;
let showHitboxes = false; // Toggle hitbox 
let healthBarWidth = 100;
// TIMER
let timeElapsed = 0; 
let timerInterval = null; 
// PAUSE MENU
let savedEnemySpeeds = []; 
// FPS
let lastTime = 0;
let frameCount = 0;
let fps = 60; 

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.onload = function() {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Stel de canvas-grootte in 
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const img = new Image();
  img.src = "../Fotos/backgrounds/background-play.png";  // pad naar afbeelding

  // Wacht tot de afbeelding geladen is en teken het op het canvas
  img.onload = function() {
      // Teken de afbeelding op het canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
};


/////////////////////////// COINS ///////////////////
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
    <div  style = "display: flex; align-items: center; gap: 8px;">
    <img  src   = "../Fotos/icon/coins-pixel.png" style = "width: 32px; height: 32px;">
    <span style = "vertical-align: middle;">${formatCoins(coins)}</span>
    </div>
  `;
}

/////////////////////////// CHARACTER ///////////////////
class Character {
  constructor(x, y, name) {
    this.x = x;
    this.y = y;
    this.name = name;
    const savedHealth = localStorage.getItem(`health_${this.name}`);
    this.health = savedHealth ? parseInt(savedHealth) : this.maxHealth;
    // character stats
    this.maxHealth = characterConfig.maxHealth;
    this.width = characterConfig.width;
    this.height = characterConfig.height;
    this.speed = characterConfig.speed;
    this.attackPower = characterConfig.attackPower;
    this.attackRange = characterConfig.attackRange;
    this.frameWidth = characterConfig.frameWidth;
    this.frameHeight = characterConfig.frameHeight;
    this.frameCount = characterConfig.frameCount;
    this.animationSpeed = characterConfig.animationSpeed;
    this.attack.frameCount = characterConfig.attackFrameCount;
    this.attack.animationSpeed = characterConfig.attackAnimationSpeed;
    this.imageSrc = characterConfig.imageSrc;
    this.attackImageSrc = characterConfig.attackImageSrc;
    this.hitbox = characterConfig.hitbox;

    this.image = new Image();
    this.image.src = this.imageSrc;
    this.attack.image = new Image();
    this.attack.image.src = this.attackImageSrc;
    this.attack.image.onload = () => {
      logDebug(this.name + " attack sprite loaded!");
    };
    this.isImageLoaded = false;
    this.isAttacking = false;
    this.isMoving = false;
    this.facingLeft = false;
    this.currentFrame = 0;
    this.animationCounter = 0;

    this.attackCooldown = false;
  }

  draw(ctx) {
    this.image.onload = () => {
      this.isImageLoaded = true;
      logDebug(this.name + " sprite loaded!");
    };
  
    ctx.save();
  
    const currentImage = this.isAttacking ? this.attack.image : this.image;
    
  
    if (this.facingLeft) {
      ctx.translate(this.x + this.width, this.y);
      ctx.scale(-1, 1); 
      ctx.drawImage(
        currentImage,
        this.currentFrame * this.frameWidth,
        0,
        this.frameWidth,
        this.frameHeight,
        0,
        0,
        this.width,
        this.height
      );
    } else {
      ctx.drawImage(
        currentImage,
        this.currentFrame * this.frameWidth,
        0,
        this.frameWidth,
        this.frameHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  
    ctx.restore();
  
    // Laa hitbox zien
    if (this.isAttacking) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.0)";
      ctx.fillRect(
        this.x - this.attackRange,
        this.y - this.attackRange,
        this.width + this.attackRange * 2,
        this.height + this.attackRange * 2
      );
    }
  
    // Update bewegen
    if (!isGameOver && this.isMoving) {
      this.animationCounter++;
      if (this.animationCounter >= this.animationSpeed) {
        this.currentFrame = (this.currentFrame + 1) % this.frameCount; 
        this.animationCounter = 0;
      }
    } else {
      this.currentFrame = 0; 
    }
  
    // teken hitbox als aan
    if (showHitboxes) {
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        this.x + this.hitbox.x,
        this.y + this.hitbox.y,
        this.hitbox.width,
        this.hitbox.height
      );
    }
  }
  

  attack() {
    if (attackCooldown) return;
  
    attackCooldown = true;
    this.isAttacking = true;
    this.attackCurrentFrame = 0; // Start eerste frame
  
    logDebug("Attack started!");
  
    const attackFrames = this.attack.frameCount;
    const animationSpeed = this.attack.animationSpeed;
  
    const attackAnimation = () => {
      if (!this.isAttacking) return;
  
      this.attackCurrentFrame++; 
  
      logDebug(`Current attack frame: ${this.attackCurrentFrame}`);
  
      if (this.attackCurrentFrame >= attackFrames) {
        this.attackCurrentFrame = 0; // herstert de animatie
        this.isAttacking = false; // Stop attack
        attackCooldown = false; // stop cooldown
        logDebug("Attack animation complete.");
        return;
      }
  
      // Update the attack frame
      this.currentFrame = this.attackCurrentFrame;
  
      // Check and update any enemies hit by the attack
      enemies.forEach((enemy) => {
        if (this.isAttacking && this.isInAttackRange(enemy)) {
          // Damage the enemy
          enemy.health -= this.attackPower;
          logDebug(`Enemy hit! Health: ${enemy.health}`);
  
          // Knockback effect
          const knockbackForce = 10;
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          enemy.knockbackX = (dx / distance) * knockbackForce;
          enemy.knockbackY = (dy / distance) * knockbackForce;
  
          // Remove the enemy if defeated
          if (enemy.health <= 0) {
            xp += 10; // Gain XP
            logDebug(`Enemy defeated! Gained XP: ${xp}`);
            handleEnemyDefeat();
            enemies = enemies.filter((e) => e !== enemy); // Remove the enemy from the array
          }
        }
      });
  
      // Request the next frame of the attack animation
      setTimeout(() => {
        requestAnimationFrame(attackAnimation);
      }, animationSpeed);
    };
  
    requestAnimationFrame(attackAnimation);
  };
  

  // Extra functie voor de controle of een vijand in het bereik van de aanval is
  isInAttackRange(enemy) {
    const isHit =
      this.x < enemy.x + enemy.width &&
      this.x + this.width > enemy.x &&
      this.y < enemy.y + enemy.height &&
      this.y + this.height > enemy.y;

    return isHit;
  }

  move(keys) {
    if (isGameOver) return; 
    let wasMoving = this.isMoving;
    this.isMoving = keys["w"] || keys["s"] || keys["a"] || keys["d"];
  
    if (keys["w"] && this.y > 0) this.y -= this.speed;
    if (keys["s"] && this.y < canvas.height - this.height) this.y += this.speed;
    if (keys["a"] && this.x > 0) {
      this.x -= this.speed;
      this.facingLeft = true;
    }
    if (keys["d"] && this.x < canvas.width - this.width) {
      this.x += this.speed;
      this.facingLeft = false;
    }
    
  
    if (!wasMoving && this.isMoving) {
      logDebug("Moving started!");
    }
  }
  
}
function healthBar() {
  ctx.fillStyle = "#ef4444"; // red-500
  ctx.fillRect(0, 0, healthBarWidth);
}

// Voeg coins toe bij het verslaan van een vijand
function handleEnemyDefeat() {
  // Genereer een willekeurig aantal coins tussen 1 en 10
  const coinsGained = Math.floor(Math.random() * 10) + 1; // Tussen 1 en 10

  // Voeg de coins toe aan de speler
  coins += coinsGained;

  // Update de coins in localStorage
  localStorage.setItem("coins", coins);

  // Update de coin display
  updateCoinDisplay();

  // Log het aantal gewonnen coins
  logDebug(`Enemy defeated! Gained ${coinsGained} coins. Total coins: ${coins}`);
}


Character.prototype.attack = function () {
  if (attackCooldown) return;

  attackCooldown = true;
  this.isAttacking = true;
  this.attackCurrentFrame = 0; // Start bij het eerste frame van de aanval

  logDebug("Attack started!");

  const attackFrames = this.attack.frameCount;
  const animationSpeed = this.attack.animationSpeed;

  const attackAnimation = () => {
    if (!this.isAttacking) return;

    this.attackCurrentFrame++;
    logDebug(`Current attack frame: ${this.attackCurrentFrame}`);

    if (this.attackCurrentFrame >= attackFrames) {
      this.attackCurrentFrame = 0;
      this.isAttacking = false;
      attackCooldown = false;
      logDebug("Attack animation complete.");
      return;
    }

    this.currentFrame = this.attackCurrentFrame;

    // Werk vijanden bij die geraakt worden door de aanval
    enemies.forEach((enemy) => {
      if (this.isAttacking && this.isInAttackRange(enemy)) {
        // Verminder de gezondheid van de vijand
        enemy.health -= this.attackPower;
        logDebug(`Enemy hit! Health: ${enemy.health}`);

        // Knockback-effect berekenen
        const knockbackForce = 10; // Pas aan voor sterker/weaker knockback
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        enemy.knockbackX = (dx / distance) * knockbackForce;
        enemy.knockbackY = (dy / distance) * knockbackForce;

        // Verwijder vijand als hij dood is
        // In je attack() functie, waar de vijand gedood wordt
        if (enemy.health <= 0) {
          xp += 10; // Voeg XP toe voor de speler
          logDebug(`Enemy defeated! Gained XP: ${xp}`);

          // Voeg coins toe
          handleEnemyDefeat(); // Dit is de functie die we hierboven hebben gedefinieerd

          // Verwijder vijand uit de array
          enemies = enemies.filter((e) => e !== enemy);

          // Verwerk de level-up als dat nodig is
          if (xp >= xpToLevelUp) {
            levelUp(); // Zorg ervoor dat de levelUp functie correct werkt
          }
        }
      }
    });

    setTimeout(() => {
      requestAnimationFrame(attackAnimation);
    }, animationSpeed);
  };

  requestAnimationFrame(attackAnimation);
};

////////////////////////// CHARACTERS PICK - CONFIG /////////////////////////////////
class Tank extends Character {
  constructor(x, y) {
    super(x, y, "tank");
    this.width = 300;
    this.height = 400;
    this.speed = 2;
    this.image.src = "../Fotos/paladin/Walk/spr_PaladinWalk_strip10.png";
    this.attack.image.src =
      "../Fotos/paladin/Attack/spr_PaladinAttackWithoutEffect_strip41.png";
    this.frameWidth = 128;
    this.frameHeight = 128;
    this.attackPower = 20;
    this.attackRange = 80;
    this.animationSpeed = 16;
    this.frameCount = 8;
    this.hitbox = { x: 80, y: 50, width: 130, height: 160 }; // Custom hitbox
  }
}

class Assassin extends Character {
  constructor(x, y) {
    super(x, y, "assassin");
    this.width = 300;
    this.height = 400;
    this.speed = 4;
    this.image.src = "../Fotos/Martial Hero/Martial_Hero/Sprites/Run.png";
    this.attack.image.src =
      "../Fotos/Martial Hero/Martial_Hero/Sprites/attack1.png";
    this.frameWidth = 200;
    this.frameHeight = 200;
    this.attackPower = 25;
    this.attackRange = 50;
    this.animationSpeed = 16;
    this.frameCount = 8;
    this.hitbox = { x: 80, y: 50, width: 130, height: 160 }; // Custom hitbox
  }
}

class Warrior extends Character {
  constructor(x, y) {
    super(x, y, "warrior");
    this.width = 320;
    this.height = 420;
    this.speed = 3;
    this.image.src = "../Fotos/sheets/spr_Walk_strip.png";
    this.attack.image.src = "../Fotos/sheets/spr_Attack_strip.png";
    this.frameWidth = 170;
    this.frameHeight = 170;
    this.attackPower = 50;
    this.attackRange = 25;
    this.animationSpeed = 16;
    this.frameCount = 8;
    this.hitbox = { x: 120, y: 90, width: 90, height: 120 }; // Custom hitbox
  }
}

function changeCharacterImage(characterName) {
  if (!player) {
    logDebug("Player is not defined yet.");
    return;
  }

  let newCharacter;

  switch (characterName) {
    case "Warrior":
      newCharacter = new Warrior(player.x, player.y);
      break;
    case "Assassin":
      newCharacter = new Assassin(player.x, player.y);
      break;
    case "Tank":
      newCharacter = new Tank(player.x, player.y);
      break;
    default:
      logDebug("Invalid character selected!");
      return;
  }

  // Vervang de speler en behoud de huidige positie
  player = newCharacter;
}

//////////////////////////////// WINDOW.RELOAD /////////////////////////////////////
window.onload = function () {
  updateCoinDisplay();

  const selectedCharacter =
    localStorage.getItem("selectedCharacter") || "Warrior"; // Fallback naar Warrior

  switch (selectedCharacter.toLowerCase()) {
    case "tank":
      player = new Tank(canvas.width / 2, canvas.height / 2);
      break;
    case "assassin":
      player = new Assassin(canvas.width / 2, canvas.height / 2);
      break;
    case "warrior":
      player = new Warrior(canvas.width / 2, canvas.height / 2);
      break;
    default:
      alert("Unknown character selected!");
      player = new Warrior(canvas.width / 2, canvas.height / 2); // Fallback naar Warrior
      break;
  }

  spawnEnemies(enemyCount);
  update();
};

function levelUp() {
  level++; // Increase spelers level
  xp = 0; // Reset XP to 0
  xpToLevelUp += 100; 
  logDebug(`Level up! New level: ${level}`);
}

/////////////////////////////////// ENEMY AI /////////////////////////////////////////////////
class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50; // 50 slime
    this.height = 50; //50 slime
    this.speed = 2;
      // Sprites voor normale animatie en aanval
      this.image = new Image();
      this.image.src = "../Fotos/Green-Slime/GreenSlimeWalking-Sheet.png"; // De spritesheet voor de vijand
      this.attackImage = new Image(); // Aanvalssprite
      this.attackImage.src = "../Fotos/Green-Slime/GreenSlimeAttack-Sheet.png"; // Specifieke aanvalssprite
    this.health = 150;
    this.maxHealth = 150; // Store max health to properly scale health bar
    this.attackDamage = 5; // Default damage for normal enemies
    this.lastAttackTime = 0;
    this.attackCooldown = 1000;
    this.knockbackX = 0;
    this.knockbackY = 0;
    this.alive = true;
    this.frameCount = 4; // Aantal frames voor animatie
    this.frameHeight = 16; //16
    this.frameWidth = 16;  //16
    this.currentFrame = 0; 
    this.lastFrameTime = 0;
    this.frameInterval = 100;
  }
  draw(ctx) {
    if (!this.alive) return; // Niet tekenen als dood

    // Teken de sprites
    const currentTime = Date.now();
    if (currentTime - this.lastFrameTime > this.frameInterval) {
      this.currentFrame = (this.currentFrame + 1) % 4;
      this.lastFrameTime = currentTime;
    }

    ctx.drawImage(
      this.isAttacking ? this.attackImage : this.image,
        this.currentFrame * this.frameWidth,
        0,
        this.frameWidth,
        this.frameHeight,
        this.x,
        this.y,
        this.width,
        this.height
    );
  
    ctx.restore(); // Herstel de originele canvas-instellingen
  
    // Gezondheidsbalk tekenen
    const healthBarWidth = this.maxHealth / 3; // Max breedte van de healthbar afhankelijk van maxHealth
  
    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y - 5, healthBarWidth, 5); // Achtergrond (rood)
    
    ctx.fillStyle = "green";
    const healthBarWidthScaled = Math.min((this.health / this.maxHealth) * healthBarWidth, healthBarWidth); // Gezondheid in schaal
    ctx.fillRect(this.x, this.y - 5, healthBarWidthScaled, 5); // Voorgrond (groen)
  };
  

  move(player) {
    if (!this.alive || isPaused || !player) return; // Check if player is defined

    // Knockback toepassen
    if (this.knockbackX !== 0 || this.knockbackY !== 0) {
      this.x += this.knockbackX;
      this.y += this.knockbackY;

      // Knockback effect verminderen
      this.knockbackX *= 0.9;
      this.knockbackY *= 0.9;

      if (Math.abs(this.knockbackX) < 0.1 && Math.abs(this.knockbackY) < 0.1) {
        this.knockbackX = 0;
        this.knockbackY = 0;
      }

      return; 
    }

    // Normale beweging naar speler
    const targetX = player.x + player.width / 2.5;
    const targetY = player.y + player.height / 3;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }

    // Aanval proberen als cooldown over is
    if (Date.now() - this.lastAttackTime >= this.attackCooldown) {
      this.attack(player);
    }
  }

  checkCollision(player) {
    const playerHitboxX = player.x + player.hitbox.x;
    const playerHitboxY = player.y + player.hitbox.y;
    return (
      this.x + this.width > playerHitboxX &&
      this.x < playerHitboxX + player.hitbox.width &&
      this.y + this.height > playerHitboxY &&
      this.y < playerHitboxY + player.hitbox.height
    );
  }

  attack(player) {
    if (isPaused) return; 

    if (this.checkCollision(player) && Date.now() - this.lastAttackTime >= this.attackCooldown) {
      this.isAttacking = true;
      this.lastAttackTime = Date.now();

      // Zet de aanval na een korte tijd weer uit
      setTimeout(() => {
        this.isAttacking = false;
      }, 500);  // De duur van de aanval
      player.health -= this.attackDamage; // Use this.attackDamage so bosses can override it
      this.lastAttackTime = Date.now();
    }
  }


  takeDamage(amount, knockbackDirection) {
    if (!this.alive || isPaused) return; // Geen schade nemen als het spel gepauzeerd is

    this.health -= amount;

    // Knockback berekenen
    const knockbackStrength = 5; // Pas aan voor sterker of zwakker effect
    this.knockbackX = knockbackDirection.x * knockbackStrength;
    this.knockbackY = knockbackDirection.y * knockbackStrength;

    // Check of vijand dood is
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    logDebug("Enemy defeated!"); // Loggen van de vijand die is verslagen

    // Willekeurig aantal coins tussen 1 en 10
    const coinsEarned = Math.floor(Math.random() * 10) + 1;

    // Voeg de verdiende coins toe
    coins += coinsEarned;

    // Sla de nieuwe waarde van coins op in localStorage
    localStorage.setItem("coins", coins);

    // Controleer de waarde van de coins in de console
    logDebug(`+${coinsEarned} coins! Total: ${coins}`);

    // Log de verandering van coins
    logDebug(`Coins updated! +${coinsEarned} coins. Total: ${coins}`);

    // Werk de weergave van coins bij
    updateCoinDisplay();
  }
}

Character.prototype.attack = function () {
  if (attackCooldown) return;

  attackCooldown = true;
  this.isAttacking = true;

  setTimeout(() => {
    this.isAttacking = false;
    attackCooldown = false;
  }, 500);

  const attackBox = {
    x: this.x - this.attackRange,
    y: this.y - this.attackRange,
    width: this.width + this.attackRange * 2,
    height: this.height + this.attackRange * 2,
  };

  enemies = enemies.filter((enemy) => {
    const isHit =
      attackBox.x < enemy.x + enemy.width &&
      attackBox.x + attackBox.width > enemy.x &&
      attackBox.y < enemy.y + enemy.height &&
      attackBox.y + attackBox.height > enemy.y;

    if (isHit) {
      enemy.health -= this.attackPower;
      logDebug(`Enemy hit! Health: ${enemy.health}`);

      const knockbackForce = 10;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      enemy.knockbackX = (dx / distance) * knockbackForce;
      enemy.knockbackY = (dy / distance) * knockbackForce;

      if (enemy.health <= 0) {
        logDebug(`Enemy defeated, removing from array.`);
        xp += 10;
        handleEnemyDefeat();
        logDebug(`XP: ${xp}`);
        if (xp >= xpToLevelUp) {
          levelUp();
        }
        return false; 
      }
    }
    return true; 
  });
};

function spawnEnemies(count, includeSpeeder = false) {
  enemies = [];
  for (let i = 0; i < count; i++) {
    let x, y;
    let side = Math.floor(Math.random() * 4);

    switch (side) {
      case 0: x = Math.random() * canvas.width; y = -50; break; // Top
      case 1: x = canvas.width + 50; y = Math.random() * canvas.height; break; // Right
      case 2: x = Math.random() * canvas.width; y = canvas.height + 50; break; // Bottom
      case 3: x = -50; y = Math.random() * canvas.height; break; // Left
    }

    if (includeSpeeder && Math.random() < 0.3) {
      enemies.push(new SpeederEnemy(x, y)); // 30% chance to be a speeder
    } else {
      enemies.push(new Enemy(x, y));
    }
  }
}

// CHECK WAVES & SPAWN BOSSES OR NEW ENEMIES
function checkWaveCompletion() {
  if (enemies.length === 0) {
    wave++;

    if (wave === 10 || wave === 20) {
      logDebug("Wave 10 or 20 reached! Spawning boss...");
      enemies.push(new BossEnemy(canvas.width / 2, canvas.height / 2));
      showBossMessage();

    } else if (wave >= 15) {
      logDebug("Wave 15 reached! Adding Speeders...");
      enemyCount += 2;
      spawnEnemies(enemyCount, true); // Spawns normal + speeders

    } else {
      enemyCount += 2;
      spawnEnemies(enemyCount);
    }
  }
}


/////////////////////////////  BOSS /////////////////////////

function showBossMessage() {
  const bossMessageElement = document.getElementById('bossMessage');
  bossMessageElement.style.display = 'block'; // Show the boss message

  // After 5 seconds, hide the boss message
  setTimeout(() => {
    bossMessageElement.style.display = 'none'; 
  }, 2000); // 5000 ms = 5 seconds
}

// Boss Class
class BossEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.width = 150;
    this.height = 150;
    this.speed = 1;
    this.health = 500;
    this.maxHealth = 500;
    this.attackDamage = 40; // Boss does 20 damage per attack
    this.image.src = "../Fotos/boss_demon_slime_FREE_v1.0/Run.png";
    this.attackImage = new Image(); // Aanvalssprite
      this.attackImage.src = "../Fotos/boss_demon_slime_FREE_v1.0/attack.png"; // Specifieke aanvalssprite 

    this.frameCount = 12; // Aantal frames voor animatie
    this.frameHeight = 180; //16
    this.frameWidth = 288;  //16
    this.frameInterval = 180;
  }

  takeDamage(amount, knockbackDirection) {
    if (!this.alive || isPaused) return;

    this.health -= amount;

    // Stronger knockback effect for the boss
    const knockbackStrength = 1; 
    this.knockbackX = knockbackDirection.x * knockbackStrength;
    this.knockbackY = knockbackDirection.y * knockbackStrength;

    if (this.health <= 0) {
      this.die();
      logDebug("Boss defeated!");
    }
  }
}


///////////////////////////////////////// SPEEDER ENEMY /////////////////////////////////////////

// SPEEDER ENEMY 
class SpeederEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.width = 150;
    this.height = 150;
    this.speed = 2; 
    this.health = 100; 
    this.maxHealth = 100;
    this.image.src = "../Fotos/NightBorne/Run.png"; 
    this.attackImage = new Image(); 
    this.attackImage.src = "../Fotos/NightBorne/attack.png"; 
    this.frameCount = 6; 
    this.frameHeight = 75; 
    this.frameWidth = 83;  
    this.frameInterval = 200;
  }
}

///////////////////////////////////////// PLAYER MOVEMENT /////////////////////////////////////////////
function handlePlayerMovement(player) {
  if (keyStates["w"]) player.y -= player.speed; // up
  if (keyStates["s"]) player.y += player.speed; // down
  if (keyStates["a"]) player.x -= player.speed; // left
  if (keyStates["d"]) player.x += player.speed; // right
}

// movement keys
document.addEventListener("keydown", (event) => {
  if (!isPaused) {
    keyStates[event.key] = true; 
    keys[event.key] = true; 
  }
});

document.addEventListener("keyup", (event) => {
  if (!isPaused) {
    keyStates[event.key] = false; 
    keys[event.key] = false; 
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    togglePause(); 
  }
});

resumeButton.addEventListener("click", () => {
  togglePause(); 
});

////////////////////////////////////////// PAUSE MENU - START /////////////////////////////////////////////
function togglePause() {
  isPaused = !isPaused; 
  if (isPaused) {
    pauseMenu.classList.remove("hidden"); 
    logDebug("Game Paused!");

    // Save en stop speler en vijanden snelheid
    savedAttack = player.attack;
    player.attack = 0; 
    savedSpeed = player.speed; 
    player.speed = 0; 
    savedEnemySpeeds = enemies.map((enemy) => enemy.speed); 
    enemies.forEach((enemy) => (enemy.speed = 0)); 

    stopTimer();
  } else {
    pauseMenu.classList.add("hidden"); 
    logDebug("Game resumed!");

    // Attack en snellheid
    player.attack = savedAttack; 
    player.speed = savedSpeed; 
    enemies.forEach((enemy, index) => {
      enemy.speed = savedEnemySpeeds[index]; 
    });

    startTimer();
  }
}

function StartGame() {
  player = new Tank(canvas.width / 2, canvas.height / 2);
  spawnEnemies(enemyCount);
  update();
}

document.addEventListener("click", () => {
  player.attack();
});

document.addEventListener("keydown", (event) => {
  if (event.key === " ") {
    player.attack();
  }
});


StartGame();

///////////////////////////////////////////    DISPLAY GAMER OVER   ////////////////////////////////////////////////////////////
const gameovertext = document.getElementById("Game-Over");
gameovertext.classList.add("hidden");
function displayGameOver() {
  gameovertext.classList.remove("hidden");
  isGameOver = true; // Zet game over aan

  savedAttack = player.attack;
  player.attack = 0; // Disable attack while paused

  savedSpeed = player.speed; // Save speler speed
  player.speed = 0; // Stop speler movement
  savedEnemySpeeds = enemies.map((enemy) => enemy.speed); // Save vijand snelheid
  enemies.forEach((enemy) => (enemy.speed = 0)); // Stop vijanden

  showGameOverButtons();

  // Stop de game loop
  cancelAnimationFrame(gameLoop);
}

///////////////////////////////////////////    GAMEROVERBUTTONS   ////////////////////////////////////////////////////////////
function showGameOverButtons() {
  const buttonContainer = document.getElementById("game-over-button");
  const restartButton = document.getElementById("Button1");
  const quitButton = document.getElementById("Button2");
  const gameOverText = document.getElementById("Game-Over-Text"); // Voeg de Game Over tekst toe

  // Maak de knoppen en tekst zichtbaar
  buttonContainer.style.display = "block";
  gameOverText.style.display = "block";

  // Functie voor herstarten van het spel
  restartButton.onclick = () => {
    buttonContainer.style.display = "none"; // Verberg de knoppen weer
    gameOverText.style.display = "none"; // Verberg de Game Over tekst
    resetGame(); // Reset het spel
    update(); // Update de game
  };

  // Functie voor teruggaan naar het hoofdmenu
  quitButton.onclick = () => {
    buttonContainer.style.display = "none"; 
    gameOverText.style.display = "none"; 
    window.location.href = "../main/main.html"; 
  };
}


///////////////////////////////////////////    RESETGAME   ////////////////////////////////////////////////////////////
function resetGame() {
  // Reset variables
  wave = 1;
  enemyCount = 5;
  xp = 0;
  level = 1;
  xpToLevelUp = 100;
  attackCooldown = false;
  showHitboxes = true;

  const savedHealth = localStorage.getItem("playerHealth");
  player.health = savedHealth ? parseInt(savedHealth) : 100;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  enemies = [];
  spawnEnemies(enemyCount);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

///////////////////////////////////////////    UPDATE THE GAME   ////////////////////////////////////////////////////////////

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (player.health <= 0) {
    stopTimer(); // timer
    displayGameOver(); // game over
    return; 
  }

  handlePlayerMovement(player); // Doet speler movement

  player.draw(ctx); // Tekent de speler op het canvas

  // Maakt het zodat speler voor vijanden wordt getekent
  if (player) {
    enemies.forEach((enemy) => {
      enemy.move(player); // beweeg vijanden
      enemy.draw(ctx); // Teken vijanden
    });
  } else {
    logDebug("Player is not defined or initialized.");
  }

  checkWaveCompletion(); // Check wave 

  const xpBar = document.getElementById("xpBar");
  xpBar.style.width = (300 * xp) / xpToLevelUp + "px"; // Update XP bar

  // Update stats
  document.getElementById("level").textContent = level;
  document.getElementById("wave").textContent = wave;
  document.getElementById("health").textContent = player.health;
  

  requestAnimationFrame(update); // GameLoop
}

requestAnimationFrame(update);

///////////////////////////////////////////    TIMER   ////////////////////////////////////////////////////////////
// Timer variables
const targetTime = 30 * 60; 

// Timer 
const timerElement = document.getElementById("timer");

// Function om timer seconde en minuten te laten zien
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${
    remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds
  }`;
}

// Function om timer te update 
function updateTimer() {
  if (!isPaused && !isGameOver) {
    timeElapsed++;

    // Update timer 
    timerElement.textContent = formatTime(timeElapsed);

    if (timeElapsed >= targetTime) {
      stopTimer();
    }
  }
}

// Function om timer te starten
function startTimer() {
  if (!timerInterval) {
    timerInterval = setInterval(updateTimer, 1000);
  }
}

// Functie om de timer te stoppen
function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

// Functie voor timer reset naar 0
function resetTimer() {
  timeElapsed = 0;
  timerElement.textContent = formatTime(timeElapsed);
  stopTimer(); 
  startTimer(); 
}

// Timer pauseer/play
function handlePauseResume() {
  if (isPaused) {
    stopTimer();
  } else {
    startTimer();
  }
}

// Doet timer
startTimer();

///////////////////////////////////////////    FPS   //////////////////////////////////////////////////////////// ONLY DEBUG
const fpsDisplay = document.getElementById("fpsDisplay"); 

function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  const frameDuration = 100 / fps; // Gebruikt Fps voor timing
  
  if (deltaTime < frameDuration) {
    requestAnimationFrame(gameLoop);
    return;
  }

  lastTime = timestamp;
  frameCount++;

  if (logDebug && frameCount >= 60) {
    fps = Math.floor(Math.random() * 60) + 1; 
    logDebug(`FPS changed to: ${fps}`); 
    frameCount = 0;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height); 

  // Update en tekent speler
  player.move(keys);
  player.draw(ctx);

  // Update en tekent vijand
  enemies.forEach((enemy) => {
    enemy.move();
    enemy.draw(ctx);
  });
  const debug = localStorage.getItem('debug') === 'true';

  // Als debug aan is laat FPS zien
  if (debug) {
    fpsDisplay.style.display = "block"; 
    fpsDisplay.textContent = `FPS: ${fps}`; 
  } else {
    fpsDisplay.style.display = "none"; 
  }

  requestAnimationFrame(gameLoop); // GameLoop
}

requestAnimationFrame(gameLoop);

// Start the timer als de game start
startTimer();
