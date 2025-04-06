const GameStateManager = {
  state: "game",
  modes: {},
};
let palette = null;

function preload() {
  Splash.logo = loadImage("/assets/splash_ai.png");
  Game.images = {
    blur: loadImage("/assets/blur.png"),
    clean: loadImage("/assets/clean.png"),
    depth: loadImage("/assets/depth.png"),
    index: loadImage("/assets/objects.png"),
  };
  Game.objectImages = {
    letters: loadImage("/assets/objects/letters.png"),
    coccinelle: loadImage("/assets/objects/coccinelle.png"),
    blueBell: loadImage("/assets/objects/blueBell.png"),
    oneEar: loadImage("/assets/objects/oneEar.png"),
  };
  soundFormats("mp3", "wav");
  // load Sound
  Game.shutter = loadSound("/assets/audio/shutter");

  Game.shutter.setVolume(1);
  Game.music = loadSound("/assets/music/EasterHunt");
  Game.musicIsPlaying = false;
}

function keyPressed() {
  if (key === "m" || key === "M") {
    if (Game.musicIsPlaying) {
      Game.musicIsPlaying = false;
      Game.music.stop();
    } else {
      Game.musicIsPlaying = true;
      Game.music.setVolume(0.5);
      Game.music.play();
    }
  }
  if (key === "f" || key === "F") {
    if (fullscreen()) {
      fullscreen(false);
    } else {
      fullscreen(true);
    }
  }
}

const Game = {
  depth: -1,

  images: null,
  objectIndices: {
    7: { name: "letters", count: 4, found: 0 },
    255: { name: "coccinelle", count: 5, found: 0 },
    41: { name: "blueBell", count: 2, found: 0 },
    61: { name: "oneEar", count: 1, found: 0 },
  },
  found: 4,
  setup: function () {
    this.images.depth.loadPixels();
    this.images.clean.loadPixels();
    this.images.blur.loadPixels();
    this.images.index.loadPixels();

    // Gaussian blur

    this.resultImage = createImage(
      this.images.depth.width,
      this.images.depth.height
    );
    this.resultImage.loadPixels();
  },
  draw: function () {
    // Mouse position to image position

    let Dx = Math.floor(mouseX / (width / this.images.depth.width));
    let Dy = Math.floor(mouseY / (height / this.images.depth.height));
    // COnstraint the values to the image size
    Dx = constrain(Dx, 0, this.images.depth.width - 1);
    Dy = constrain(Dy, 0, this.images.depth.height - 1);

    // Get the pixel index
    const index = (Dx + Dy * this.images.depth.width) * 4;

    // Get the depth value
    const depth = this.images.depth.pixels[index];
    if (depth !== this.depth) {
      this.depth = this.images.depth.pixels[index];
      for (x = 0; x < this.images.depth.width; x++) {
        for (y = 0; y < this.images.depth.height; y++) {
          const index = (x + y * this.images.depth.width) * 4;

          const focus =
            Math.abs(this.images.depth.pixels[index] - this.depth) < 10;
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
      this.resultImage.updatePixels();
    }
    // Draw the objects at the bottom of the screen

    // Draw the image
    imageMode(CENTER);
    image(this.resultImage, width / 2, height / 2, width, height);
    this.drawObjects();
  },
  drawObjects: function () {
    const objectNames = Object.keys(this.objectIndices);
    const objectCount = objectNames.length;

    const w = 64;
    const h = 64;
    const sx = width / 2 - (objectCount * 64) / 2 + w / 2;
    const sy = 64;

    const offset = 0;
    rectMode(CENTER);
    fill(0, 0, 0, 200);
    rect(width / 2, sy + 10, objectCount * w + 20, h + 32, 20);
    fill(palette.get(0));
    textAlign(CENTER, CENTER);
    textSize(16);
    for (let i = 0; i < objectCount; i++) {
      const objectName = objectNames[i];
      const object = this.objectIndices[objectName];
      const ObjectImage = this.objectImages[object.name];
      if (image) {
        imageMode(CENTER);
        image(ObjectImage, sx + offset + i * w, sy, w, h);
        text(
          object.found + "/" + object.count,
          sx + offset + i * w,
          sy + 32 + 10
        );
      }
    }
    // Add text on the top right that says "M for Mute" and "F for Fullscreen"
    textAlign(RIGHT, TOP);
    textSize(16);
    fill(palette.get(0));
    text("M for Mute", width - 20, 20);
    text("F for Fullscreen", width - 20, 40);
    textAlign(CENTER, CENTER);
    textSize(16);
  },
  mousePressed: function () {
    // Get the pixel index
    const Dx = Math.floor(mouseX / (width / this.images.depth.width));
    const Dy = Math.floor(mouseY / (height / this.images.depth.height));
    // COnstraint the values to the image size
    const index = (Dx + Dy * this.images.depth.width) * 4;
    // Get the index value
    const indexValue = this.images.index.pixels[index];
    console.log("Index value: " + indexValue);
    this.removeObject(indexValue, Dx, Dy);
    if (this.objectIndices[indexValue]) {
      const object = this.objectIndices[indexValue];
      console.log("Found object: " + object.name);
      // Play the sound
      if (this.shutter) {
        this.shutter.play();
      }
      // Decrease the count
      object.found++;
      if (object.found == object.count) {
        this.found--;
        console.log("Found all objects: " + object.name);
        if (this.found == 0) {
          console.log("Found all objects");
          GameStateManager.state = "menu";
        }
      }
    }
  },
  removeObject: function (indexValue, Dx, Dy) {
    const x = Dx;
    const y = Dy;
    const w = this.images.depth.width;
    const h = this.images.depth.height;
    const pixels = this.images.index.pixels;
    const queue = [];
    queue.push({ x, y });
    const visited = new Set();
    while (queue.length > 0) {
      const { x, y } = queue.shift();
      const index = (x + y * w) * 4;
      if (visited.has(index)) {
        continue;
      }
      visited.add(index);
      // Check if the pixel is part of the object
      if (pixels[index] === indexValue) {
        // Set the pixel to transparent
        pixels[index] = 0;
        pixels[index + 1] = 0;
        pixels[index + 2] = 0;
        pixels[index + 3] = 0;
        queue.push({ x: x + 1, y });
        queue.push({ x: x - 1, y });
        queue.push({ x, y: y + 1 });
        queue.push({ x, y: y - 1 });
      }
    }
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
    GameStateManager.state = "game";
    Game.musicIsPlaying = true;
    Game.music.play();
    Game.music.loop();
    Game.music.setVolume(0.5);
    Game.music.setLoop(true);

    Game.startTime = millis();
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

function mousePressed() {
  GameStateManager.modes[GameStateManager.state].mousePressed();
}

function setup() {
  palette = createPalette(
    "d48418-a86f24-705532-544839-383a40-2d3543-273244-212f45"
  );
  // Create canvas and put it in the canvas div to guess the size
  imageMode(CENTER);

  c = createCanvas(displayWidth * 0.8, displayHeight * 0.8).parent("#canvas");
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
