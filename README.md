# MTG Arena Tool
An MTG Arena deck tracker and collection manager.

![History Screen](/Readme/screenshot_1.png)

## Current features
- In-game overlay
	- Cards left in library
	- Actions log
	- Odds of drawing
	- Full deck with sideboard
	- Draft helper
	- Clock (chess clock, total elapsed time, current time, priority marker)
- History of games played
	- Cards your opponents played
	- View games action logs
	- Sideboard / mulligan
	- Export decklists
- Collection browser
	- Filter cards by set
	- Show newly acquired cards
	- Show incomplete set cards (less than 4 copies)
	- Sort by set, name and cmc
	- Advanced card filtering and search
	- Show cards unowned
	- Collection completion statistics
- Individual deck statistics
	- Win/loss ratios
	- Wildcards needed
	- Show cards missing
	- Mana curve
	- Winrate vs color combinations
	- Visual view
	- Deck export (to mtga, txt, csv)
- Draft tracker
	- In-draft overlay
	- Assistant (shows best picks)
	- Replayer
	- Draft sharing
- Explore decks
	- Filter by event
	- Filter by owned
	- See wildcards and boosters needed
	- Sort by winrate, boosters required

### Compiling / Run from source
MTG Arena Tool is developed using Electron JS, To get started simply clone this repo and install:

```
git clone https://github.com/Manuel-777/MTG-Arena-Tool
cd MTG-Arena-Tool
npm install
npm start
```

You can toggle developer tools for debugging using `Shift+Alt+D`, or using `F12` if you run from source.

### Download
Currently, our releases are hosted [here at GitHub](https://github.com/Manuel-777/MTG-Arena-Tool/releases). You will find all stable and pre-production releases right here.

Once downloaded the installer should simply install and run immediately. The app will read your user data and warn you if anything goes wrong.

### Disclaimer

Even though no official statement has been made about third party software by MTG Arena developers, I am obliged to put a warning about the use of this software.

It is not stated if it is legal or allowed by Wizards of the Coast to use Deck Trackers and other tools alike while playing MTG Arena, therefore MTG Arena Tool developers are not responsible if your account gets banned, locked or suspended for using this software. `Use at your own risk.`

MtG Arena Tool is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.

Please read about [our Privacy Policy and How we use your data here](https://github.com/Manuel-777/MTG-Arena-Tool/blob/master/PRIVACY.md)

### Credits
[Electron](https://electronjs.org/)

[Electron Store by Sindre Sorhus](https://github.com/sindresorhus/electron-store)

[Jquery Easing by GSGD](http://gsgd.co.uk/sandbox/jquery/easing/)

[Conic Gradient Polyfill by Lea Verou](https://leaverou.github.io/conic-gradient/)

[Spectrum color picker by Brian Grinstead](http://bgrins.github.io/spectrum/)

[Draft ranking by Magic Community Set Reviews](https://www.mtgcommunityreview.com/)

[Scryfall.com](http://scryfall.com) in particular, for making an absolutely stunning database of every single card in the multiverse.

### Questions?
You can find me at any of these;
[Twitter](https://twitter.com/MEtchegaray7)
[Discord](https://discord.gg/K9bPkJy)
[mtgatool@gmail.com](mailto:mtgatool@gmail.com)
