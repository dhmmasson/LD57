//Resize canvas to fill the div
function windowResized() {
  const size = select("#canvas").size();

  // Square Board
  let minSize = min(size.width, size.height);
  resizeCanvas(minSize, minSize);
  // Force Menu refresh
  Game.currentMenu = "";
}
