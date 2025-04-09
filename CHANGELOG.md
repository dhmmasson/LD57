## v1.0.1 (2025-04-09)

### Refactor

- **game**: remove unused touchGui library

### Perf

- **game**: improve loading time by loading the music later

## v1.0.0 (2025-04-09)

### Feat

- update website title and metadata; add splash image
- update blender source files
- add the sounds for the shutter and the music
- add a leader board
- add music and full screen
- **image**: Latest version of the hunt
- found the object in the scene
- add easterScene Blend file
- add depth of field effect
- add a game menu mode
- add a splash screen

### Fix

- update asset paths to use relative URLs
- correct initial canvas size
- remove debug log from windowResized function
- update button handling method in Menu
- correct p5 library paths in index.qmd

### Refactor

- rename Game into GameStateManager

### Perf

- update p5js to include willReadFrequently: true
