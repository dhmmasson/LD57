const GameStateManager = {
  state: "game",
  modes: {},
};
let palette = null;

const Game = {
  depth: 100,

  images: null,
  setup: function () {
    this.pixels = [];
    this.images.depth.loadPixels();
    console.log(this);
    this.pixels = this.images.depth.pixels.slice();
    this.images.clean.loadPixels();
    this.images.blur.loadPixels();

    // Gaussian blur

    this.resultImage = createImage(
      this.images.depth.width,
      this.images.depth.height
    );
    this.resultImage.loadPixels();
  },
  draw: function () {
    background(0);
    // Mouse position to image position

    let Dx = Math.floor(mouseX / (width / this.images.depth.width));
    let Dy = Math.floor(mouseY / (height / this.images.depth.height));
    // COnstraint the values to the image size
    Dx = constrain(Dx, 0, this.images.depth.width - 1);
    Dy = constrain(Dy, 0, this.images.depth.height - 1);

    // Get the pixel index
    const index = (Dx + Dy * this.images.depth.width) * 4;

    // Get the depth value
    this.depth = this.pixels[index];
    console.log(Dx, Dy, this.depth);
    for (x = 0; x < this.images.depth.width; x++) {
      for (y = 0; y < this.images.depth.height; y++) {
        const index = (x + y * this.images.depth.width) * 4;

        const focus = Math.abs(this.pixels[index] - this.depth) < 10;
        if (focus) {
          // copy the data from the pixel array
          const r = this.images.clean.pixels[index];
          const g = this.images.clean.pixels[index + 1];
          const b = this.images.clean.pixels[index + 2];
          this.resultImage.set(x, y, color(r, g, b, 255));
        } else {
          const r = this.images.blur.pixels[index];
          const g = this.images.blur.pixels[index + 1];
          const b = this.images.blur.pixels[index + 2];
          this.resultImage.set(x, y, color(r, g, b, 255));
        }
      }
    }
    this.resultImage.set(Dx, Dy, color(255, 0, 0, 255));
    for (i = 0; i < 10; i++) {
      this.resultImage.set(Dx + i, Dy, color(255, 0, 0, 255));
      this.resultImage.set(Dx - i, Dy, color(255, 0, 0, 255));
      this.resultImage.set(Dx, Dy + i, color(255, 0, 0, 255));
      this.resultImage.set(Dx, Dy - i, color(255, 0, 0, 255));
    }

    this.resultImage.updatePixels();
    // Draw the image
    imageMode(CENTER);
    image(this.resultImage, width / 2, height / 2, width, height);
  },
  mousePressed: function () {
    // Mouse position to image position
    const Dx = Math.floor(mouseX / (width / this.images.depth.width));
    const Dy = Math.floor(mouseY / (height / this.images.depth.height));
    // Get the pixel index
    const index = (Dx + Dy * this.images.depth.width) * 4;
    this.depth = this.pixels[index];
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
  Game.images = {
    blur: loadImage("/assets/blur.png"),
    clean: loadImage("/assets/clean.png"),
    depth: loadImage("/assets/depth.png"),
  };
}

function mousePressed() {
  GameStateManager.modes[GameStateManager.state].mousePressed();
}

function setup() {
  palette = createPalette(
    "d48418-a86f24-705532-544839-383a40-2d3543-273244-212f45"
  );
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
