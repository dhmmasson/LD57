const GameStateManager = {
  state: "splash",
  modes: {},
};
let palette = null;

function preload() {
  Splash.logo = loadImage("./assets/splash.jpg");
  Game.images = {
    blur: loadImage("./assets/blur.png"),
    clean: loadImage("./assets/clean.png"),
    depth: loadImage("./assets/depth.png"),
    index: loadImage("./assets/objects.png"),
  };
  Game.objectImages = {
    letters: loadImage("./assets/objects/letters.png"),
    coccinelle: loadImage("./assets/objects/coccinelle.png"),
    blueBell: loadImage("./assets/objects/blueBell.png"),
    oneEar: loadImage("./assets/objects/oneEar.png"),
  };
  soundFormats("mp3", "wav");
  // load Sound
  Game.shutter = loadSound("./assets/audio/shutter");

  Game.shutter.setVolume(1);

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
    this.blockSizeX = Math.floor(this.images.depth.width / 5);
    this.blockSizeY = Math.floor(this.images.depth.height / 5);
    // Split the image in 5x5
    this.resultImage = createImage(this.blockSizeX, this.blockSizeY);
    this.resultImage.loadPixels();
  },

  draw: function () {
    // Mouse position to image position
    imageMode(CORNER);
    image(this.images.blur, 0, 0, width, height);
    let Dx = Math.floor(mouseX / (width / this.images.depth.width));
    let Dy = Math.floor(mouseY / (height / this.images.depth.height));
    // COnstraint the values to the image size
    Dx = constrain(Dx, 0, this.images.depth.width - 1);
    Dy = constrain(Dy, 0, this.images.depth.height - 1);

    // Get the pixel index
    const index = (Dx + Dy * this.images.depth.width) * 4;
    // Get the depth value
    const depth = this.images.depth.pixels[index];

    this.depth = lerp(this.depth, depth, 0.2);
    const clean = this.images.clean.pixels;
    const blur = this.images.blur.pixels;

    for (let gridX = 0; gridX < 5; gridX++) {
      for (let gridY = 0; gridY < 5; gridY++) {
        const subImage = this.resultImage;
        const startX = gridX * this.blockSizeX;
        const startY = gridY * this.blockSizeY;

        let blockChanged = false;

        for (let x = 0; x < this.blockSizeX; x++) {
          for (let y = 0; y < this.blockSizeY; y++) {
            const indexSrc =
              (startX + x + (startY + y) * this.images.depth.width) * 4;
            const indexDest = (x + y * this.blockSizeX) * 4;

            subImage.pixels[indexDest] = blur[indexSrc];
            subImage.pixels[indexDest + 1] = blur[indexSrc + 1];
            subImage.pixels[indexDest + 2] = blur[indexSrc + 2];
            subImage.pixels[indexDest + 3] = blur[indexSrc + 3];

            const focus =
              Math.abs(this.images.depth.pixels[indexSrc] - this.depth) < 15;
            let focalDistance =
              Math.abs(this.images.depth.pixels[indexSrc] - depth) / 50;
            // Clamp the value between 0 and 1
            focalDistance = constrain(focalDistance, 0, 1);
            // focalDistance = focalDistance * focalDistance;

            if (focus) {
              blockChanged = true;

              subImage.pixels[indexDest] = lerp(
                clean[indexSrc],
                blur[indexSrc],
                focalDistance
              );
              subImage.pixels[indexDest + 1] = lerp(
                clean[indexSrc + 1],
                blur[indexSrc + 1],
                focalDistance
              );
              subImage.pixels[indexDest + 2] = lerp(
                clean[indexSrc + 2],
                blur[indexSrc + 2],
                focalDistance
              );
              subImage.pixels[indexDest + 3] = lerp(
                clean[indexSrc + 3],
                blur[indexSrc + 3],
                focalDistance
              );
            }
            blockChanged = true;
          }
        }

        if (blockChanged) {
          subImage.updatePixels();

          copy(
            subImage,
            0,
            0,
            this.blockSizeX * 2,
            this.blockSizeY * 2, // Why *2 !
            (gridX * width) / 5,
            (gridY * height) / 5,
            canvas.width / 5,
            canvas.height / 5
          );
        }
      }
    }

    // Draw the objects at the bottom of the screen

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
          Game.endTime = millis();
          const FinishTime = Math.floor(Game.endTime - Game.startTime);

          // Ask the user its name
          const name = prompt("Enter your name");
          if (name) {
            //clean the name
            const cleanName = name.replace(/[^a-zA-Z0-9]/g, "");

            const urlBase =
              "http://dreamlo.com/lb/niC_UulGz0KkFKyAy1yUNA6St-4c9bIUmY3-WCqRZYCA";
            const url = `${urlBase}/add/${cleanName}/${FinishTime}/${FinishTime}`;
            console.log("URL: ", url);
            fetch(url).finally(() => {
              this.getScore();
            });
          }
        }
      }
    }
  },
  getScore: function () {
    // get the leaderboard
    const ScoreUrl = `http://dreamlo.com/lb/67f304df8f40c1c224f3d672/json`;
    fetch(ScoreUrl)
      .then((response) => response.json())
      .then((data) => {
        //{"dreamlo":{"leaderboard":{"entry":{"name":"Dimitri","score":"0","seconds":"0","text":"","date":"4/6/2025 10:57:37 PM"}}}}
        console.log("Score data: ", data);
        const scores = data.dreamlo.leaderboard.entry;
        if (!scores) {
          console.error("No scores found");
          return;
        }
        if (!Array.isArray(scores)) {
          console.error("Scores is not an array");
          return;
        }
        // Sort the scores by score
        scores.sort((a, b) => a.score - b.score);
        // Get the top 10 scores
        const topScores = scores.slice(0, 10);
        console.log("Top Scores: ", topScores);
        Game.topScores = topScores;
      })
      .catch((error) => {
        console.error("Error fetching scores: ", error);
      });
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
  first: true,
  loadMusic: function () {
    this.first = false;

    Game.music = loadSound("./assets/music/EasterHunt");
  },
  draw: function () {
    background(0);
    // Draw an image
    imageMode(CENTER);
    image(this.logo, width / 2, height / 2, width, height);

    fill(0, 0, 0, 200);
    rectMode(CENTER);
    rect(width / 2, height / 2, width - 20, height - 20, 20);

    fill(palette.get(0));
    textSize(64);
    textAlign(CENTER, CENTER);
    text("Focus Hunt", width / 2, height / 2);
    textSize(20);
    text("A Look-and-Find in the Field of Depth", width / 2, height / 2 + 64);
    textSize(20);
    fill(palette.get(0));

    description = [
      "Move your mouse to get your camera to focus",
      "Look and Find : ",
      "1 one eared rabbit,",
      "2 Blue bells,",
      "the letters ALBA,",
      "and 5 ladybugs",
      "Click to take a picture",
    ];
    description.forEach((line, i) => {
      text(line, width / 2, height / 2 + 128 + i * 32);
    });
    if (this.first) {
      this.loadMusic();
    }
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
  setup: function () {},
  draw: function () {
    background(0);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Congratulation You Win", width / 2, height / 2 - 64);
    textSize(16);
    text("You found all the objects", width / 2, height / 2 - 32);
    text(
      `Time : ${
        Math.floor((Game.endTime - Game.startTime) / 10) / 100
      } seconds`,
      width / 2,
      height / 2
    );

    if (Game.topScores) {
      textSize(20);
      text("Top Scores", width / 2, height / 2 + 64);
      const scores = Game.topScores;
      const y = height / 2 + 64 + 32;
      scores.forEach((score, i) => {
        text(
          `${i + 1}. ${score.name} in ${
            Math.floor(score.score / 10) / 100
          } seconds`,
          width / 2,
          y + i * 32
        );
      });
    }
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

  // Set the background color
  background(0);
  // Write loading text
  fill(255);
  textSize(palette.get(0));
  textAlign(CENTER, CENTER);
  text("Loading...", width / 2, height / 2);

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
