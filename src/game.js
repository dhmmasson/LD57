const Game = {
  state: "splash",
  modes: {},
};

Splash = {
  logo: null,
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
    Game.state = "menu";
  },
};

Menu = {
  draw: function () {
    background(0);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Main Menu", width / 2, height / 2);
  },

  mousePressed: function () {
    Game.state = "splash";
  },
};

function preload() {
  Splash.logo = loadImage("/assets/splash_ai.png");
}

function mousePressed() {
  Game.modes[Game.state].mousePressed();
}

function setup() {
  // Create canvas and put it in the canvas div to guess the size
  imageMode(CENTER);

  Game.modes.splash = Splash;
  Game.modes.menu = Menu;

  c = createCanvas(displayWidth, displayHeight).parent("#canvas");
  windowResized();

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
  if (Game.modes[Game.state]) {
    Game.modes[Game.state].draw();
  } else {
    console.error("No menu found for state: " + Game.state);
  }
}
