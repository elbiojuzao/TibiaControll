# Tibia Wheel of Destiny Planner

[![License: LGPL v3](https://img.shields.io/badge/License-LGPL_v3-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)

This is a small web-app that allows you to plan your Wheel of Destiny setups.

Start by searching for a character, or choosing a vocation and level. The interface
works like in the game - click to select a perk and use buttons
to add or remove points. Right click on a slice to fill it completely; if it's already
full or you have no points left it will be cleared instead.

You can share your builds using the URL, which automatically updates
when you change anything (character name is not saved).

The app tries to prevent you from doing something that won't be possible in
the game, but at the moment there is a small bug that allows you to create
disconnected islands of neighbouring perks.

Character search uses [TibiaData API](https://tibiadata.com/).

The images are pulled directly from the files hosted by CipSoft when the app
is built and are not stored in this repository - I do not claim any
copyright on them - this app is made with hope that it will be
useful to the community.

The data is input manually, I didn't find the dataset anywhere in the client,
so it's created by hand.

## TODO
- [x] knight data setup
- [x] druid data setup
- [x] paladin data setup
- [x] sorcerer data setup
- [ ] fix sorcerer rotation jump
- [ ] fix removing points check to disallow "islands"
- [x] refactor
- [ ] add tests
- [x] add sharing support
- [ ] group conviction perks
- [x] highlight slices and support clicking on slice instead of icon
- [ ] add pathfinding
- [ ] improve perk summary UX
- [ ] mobile?
