"use strict";
/*
globals
  cardsDb,
  makeId,
  get_card_type_sort,
  addCardSeparator,
  addCardTile,
  compare_cards,
  getWildcardsMissing,
  setsList,
  get_set_code
*/
const CardsList = require("./cards-list.js");
const Colors = require("./colors.js");

class Deck {
  constructor(mtgaDeck = {}, main = false, side = false) {
    if (!mtgaDeck.mainDeck) mtgaDeck.mainDeck = [];
    if (!mtgaDeck.sideboard) mtgaDeck.sideboard = [];
    if (main) mtgaDeck.mainDeck = main;
    if (side) mtgaDeck.sideboard = side;

    this.mainboard = new CardsList(mtgaDeck.mainDeck);
    this.sideboard = new CardsList(mtgaDeck.sideboard);
    this.name = mtgaDeck.name || "";
    this.id = mtgaDeck.id || "";
    this.lastUpdated = mtgaDeck.lastUpdated || "";
    this.tile = mtgaDeck.deckTileId ? mtgaDeck.deckTileId : 67003;
    this._colors = undefined;
    this.tags = mtgaDeck.tags || [mtgaDeck.format];
    this.custom = mtgaDeck.custom || false;

   //this.sortMainboard(compare_cards);
   //this.sortSideboard(compare_cards);

    return this;
  }

  /**
   * returns the colors of this deck, or creates a new colors object
   * if not defined yet.
   **/
  get colors() {
    return this._colors || this.getColors();
  }

  sortMainboard(func) {
    this.mainboard.get().sort(func);
  }

  sortSideboard(func) {
    this.sideboard.get().sort(func);
  }


  /**
   * returns a clone of this deck, not referenced to this instance.
   **/
  clone() {
    let main = objectClone(this.mainboard.get());
    let side = objectClone(this.sideboard.get());

    let obj = {
      name: this.name,
      id: this.id,
      lastUpdated: this.lastUpdated,
      deckTileId: this.tile,
      tags: this.tags,
      custom: this.custom
    };

    let ret = new Deck(objectClone(obj), main, side);

    return ret;
  }

  /**
   * returns a color object based on the colors of the cards within
   * the mainboard or, if specified, the sideboard.
   * By default it only return the mainboard.
   **/
  getColors(countMainboard = true, countSideboard = false) {
    this._colors = new Colors();

    if (countMainboard) {
      let mainboardColors = this.mainboard.getColors();
      this._colors.addFromColor(mainboardColors);
    }

    if (countSideboard) {
      let sideboardColors = this.sideboard.getColors();
      this._colors.addFromColor(sideboardColors);
    }

    return this._colors;
  }

  /**
   * Return how many of each wildcard we need to complete this deck.
   **/
  getMissingWildcards(countMainboard = true, countSideboard = true) {
    let missing = {
      rare: 0,
      common: 0,
      uncommon: 0,
      mythic: 0,
      token: 0,
      land: 0
    };

    if (countMainboard) {
      this.mainboard.get().forEach(card => {
        var grpid = card.id;
        var quantity = card.quantity;
        var rarity = cardsDb.get(grpid).rarity;

        let add = getWildcardsMissing(grpid, quantity);

        missing[rarity] += add;
      });
    }

    if (countSideboard) {
      this.sideboard.get().forEach(card => {
        var grpid = card.id;
        var quantity = card.quantity;
        var rarity = cardsDb.get(grpid).rarity;

        let add = getWildcardsMissing(grpid, quantity);

        missing[rarity] += add;
      });
    }

    return missing;
  }

  /**
   * Draws this deck on the specified DOM object
   **/
  draw(div) {
    var unique = makeId(4);
    div.html("");
    var prevIndex = 0;

    let mainBoard = this.mainboard;
    mainBoard.get().forEach(function(card) {
      let grpId = card.id;
      let type = cardsDb.get(grpId).type;
      let cardTypeSort = get_card_type_sort(type);
      if (prevIndex == 0) {
        let q = mainBoard.countType(type);
        addCardSeparator(cardTypeSort, div, q);
      } else if (prevIndex != 0) {
        if (cardTypeSort != get_card_type_sort(cardsDb.get(prevIndex).type)) {
          let q = mainBoard.countType(type);
          addCardSeparator(cardTypeSort, div, q);
        }
      }

      if (card.quantity > 0) {
        addCardTile(grpId, unique + "a", card.quantity, div);
      }

      prevIndex = grpId;
    });

    let sideBoard = this.sideboard;
    if (sideBoard._list.length > 0) {
      addCardSeparator(99, div, sideBoard.count());
      prevIndex = 0;
      sideBoard.get().forEach(card => {
        var grpId = card.id;
        if (card.quantity > 0) {
          addCardTile(grpId, unique + "b", card.quantity, div);
        }
      });
    }
  }

  /**
   * Returns a txt format string of this deck.
   **/
  getExportTxt() {
    let str = "";
    let mainList = this.mainboard.removeDuplicates(false);
    mainList.forEach(function(card) {
      let grpid = card.id;
      let card_name = cardsDb.get(grpid).name;

      str += (card.measurable ? card.quantity : 1) + " " + card_name + "\r\n";
    });

    str += "\r\n";

    let sideList = this.sideboard.removeDuplicates(false);
    sideList.forEach(function(card) {
      let grpid = card.id;
      let card_name = cardsDb.get(grpid).name;

      str += (card.measurable ? card.quantity : 1) + " " + card_name + "\r\n";
    });

    return str;
  }

  getExportArena() {
    let str = "";
    let listMain = this.mainboard.removeDuplicates(false);
    listMain.forEach(function(card) {
      let grpid = card.id;
      let cardObj = cardsDb.get(grpid);

      if (cardObj.set == "Mythic Edition") {
        grpid = cardObj.reprints[0];
        cardObj = cardsDb.get(grpid);
      }

      let card_name = cardObj.name;
      let card_set = cardObj.set;
      let card_cn = cardObj.cid;
      let card_q = card.measurable ? card.quantity : 1;

      let set_code = setsList[card_set].arenacode || get_set_code(card_set);
      str += `${card_q} ${card_name} (${set_code}) ${card_cn} \r\n`;
    });

    str += "\r\n";

    let listSide = this.sideboard.removeDuplicates(false);
    listSide.forEach(function(card) {
      let grpid = card.id;
      let cardObj = cardsDb.get(grpid);

      if (cardObj.set == "Mythic Edition") {
        grpid = cardObj.reprints[0];
        cardObj = cardsDb.get(grpid);
      }

      let card_name = cardObj.name;
      let card_set = cardObj.set;
      let card_cn = cardObj.cid;
      let card_q = card.measurable ? card.quantity : 1;

      let set_code = setsList[card_set].arenacode || get_set_code(card_set);
      str += `${card_q} ${card_name} (${set_code}) ${card_cn} \r\n`;
    });

    return str;
  }

  getSave() {
    let ret = {};
    ret.mainDeck = this.mainboard.get();
    ret.sideboard = this.sideboard.get();
    ret.name = this.name;
    ret.id = this.id;
    ret.lastUpdated = this.lastUpdated;
    ret.deckTileId = this.tile;
    ret.colors = this.colors.get();
    ret.tags = this.tags;
    ret.custom = this.custom;

    let cloned = objectClone(ret);
    return cloned;
  }

  getUniqueString(checkSide = true) {
    this.sortMainboard(compare_cards);
    this.sortSideboard(compare_cards);

    let str = "";
    this.mainboard.get().forEach(card => {
      str += card.id + "," + card.quantity + ",";
    });

    if (checkSide) {
      this.sideboard.get().forEach(card => {
        str += card.id + "," + card.quantity + ",";
      });
    }

    return str;
  }
}

module.exports = Deck;
