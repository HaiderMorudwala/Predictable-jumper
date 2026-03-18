# Predictable-jumper
Predictable Jumper is a physics-based 2D platformer built using the Phaser 3 framework. The game features 20 levels divided across four distinct thematic worlds, each introduced with unique visual aesthetics and environmental mechanics.

Game Features
Four Thematic Sectors: The game progresses through Nature, Obsidian, Ice, and Autumn environments.
Dynamic Environments: Includes environmental effects such as continuous snow in the Ice sector and a wind system in the Autumn sector that applies horizontal force to the player.
Physics-Based Movement: Utilizes the Phaser Arcade Physics engine for gravity, collisions, and platform interactions.
Moving Platforms: Features automated moving platforms with liquid-like slime decorations that require precise timing to navigate.
Persistent Tracking: A death counter tracks total attempts across all levels and sessions.

Technical Details
Controls
Arrow Keys: Move the character left or right and jump.
Space/Up Arrow: Perform a jump from the ground or a moving platform.
UI Buttons: On-screen buttons for pausing the game, exiting to the menu, and navigating between levels.

Architecture
index.html: Defines the game container, HUD, and menu overlays.
style.css: Manages the visual interface, including the blurred glass effects for the HUD and the snowflake animations.
main.js: Contains the core game logic, including the Seeded RNG for level generation, the wind particle systems, and the scene management.

Installation and Setup
Clone the repository to your local machine.
Ensure all three files (index.html, main.js, style.css) are in the same directory.
Open index.html in a modern web browser.
Because the game uses Phaser via CDN, an active internet connection is required to load the library.

Development Credits
Framework: Phaser 3.
Typography: DM Sans and DM Mono via Google Fonts.
Developer: Haider Morudwala.
