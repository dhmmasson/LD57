const GameStateManager = {
  state: "splash",
  modes: {},
};

const Game = {
  setup: function () {},
  draw: function () {
    background(0);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Game State", width / 2, height / 2);
  },
  mousePressed: function () {
    GameStateManager.state = "menu";
  },
};

Splash = {
  logo: null,
  setup: function () {},
  draw: function () {
    background(0);
    // Draw an image
    imageMode(CENTER);
    image(this.logo, width / 2, height / 2, width, height);

    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Titan's Depth", width / 2, height / 2);
  },

  mousePressed: function () {
    GameStateManager.state = "menu";
  },
};

Menu = {
  title: "Main Menu",
  buttonSize: 200,
  buttonSpacing: 10,
  buttons: [
    {
      label: "Start Game",
      action: () => {
        console.log("Start Game");
        GameStateManager.state = "game";
      },
      handle: null,
    },
    { label: "Options", action: () => {}, handle: null },
  ],
  setup: function () {
    this.gui = createGui();
    let y = height / 2 - (this.buttons.length * 32) / 2;
    this.buttons.forEach((button) => {
      button.handle = createButton(
        button.label,
        width / 2 - this.buttonSize / 2,
        y,
        this.buttonSize,
        32
      );
      y += 32 + this.buttonSpacing;
    });
  },
  draw: function () {
    background(0);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text(this.title, width / 2, height / 2);
    this.checkButtons();
    drawGui();
  },
  checkButtons: function () {
    this.buttons.forEach((button) => {
      if (button.handle.isPressed) {
        button.action();
      }
    });
  },
  mousePressed: function () {},
};

function preload() {
  Splash.logo = loadImage("/assets/splash_ai.png");
}

function mousePressed() {
  GameStateManager.modes[GameStateManager.state].mousePressed();
}

function setup() {
  // Create canvas and put it in the canvas div to guess the size
  imageMode(CENTER);

  c = createCanvas(displayWidth, displayHeight).parent("#canvas");
  windowResized();

  GameStateManager.modes.splash = Splash;
  GameStateManager.modes.menu = Menu;
  GameStateManager.modes.game = Game;

  Object.keys(GameStateManager.modes).forEach((key) => {
    GameStateManager.modes[key].setup();
  });

  const scroll = () => {
    window.scrollBy({
      top: c.elt.getBoundingClientRect().top - 10,
      behavior: "smooth",
    });
  };
  setTimeout(scroll, 100);
}

function draw() {
  // Clear the canvas
  background(0);
  // Draw the current menu
  if (GameStateManager.modes[GameStateManager.state]) {
    GameStateManager.modes[GameStateManager.state].draw();
  } else {
    console.error("No menu found for state: " + GameStateManager.state);
  }
}
