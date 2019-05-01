/* eslint-disable */

function onLabelOutLogInfo(entry, json) {
  if (!json) return;
  if (skipMatch) return;

  if (json.params.messageName == "DuelScene.GameStop") {
    currentMatch.opponent.cards = currentMatch.oppCardsUsed;

    var payload = json.params.payloadObject;
    var mid = payload.matchId + "-" + playerData.arenaId;
    var time = payload.secondsCount;
    if (mid == currentMatch.matchId) {
      gameNumberCompleted = payload.gameNumber;
      currentMatch.matchTime += time;

      let game = {};
      game.shuffledOrder = [];
      for (let i = 0; i < initialLibraryInstanceIds.length; i++) {
        let instance = initialLibraryInstanceIds[i];
        while (
          (!instanceToCardIdMap[instance] ||
            !cardsDb.get(instanceToCardIdMap[instance])) &&
          idChanges[instance]
        ) {
          instance = idChanges[instance];
        }
        let cardId = instanceToCardIdMap[instance];
        if (cardsDb.get(cardId)) {
          game.shuffledOrder.push(cardId);
        } else {
          break;
        }
      }
      game.handsDrawn = payload.mulliganedHands.map(hand =>
        hand.map(card => card.grpId)
      );
      game.handsDrawn.push(
        game.shuffledOrder.slice(0, 7 - game.handsDrawn.length)
      );

      if (gameNumberCompleted > 1) {
        let deckDiff = {};
        currentMatch.player.deck.mainboard.get().forEach(card => {
          deckDiff[card.id] = card.quantity;
        });
        currentMatch.player.originalDeck.mainboard.get().forEach(card => {
          deckDiff[card.id] = (deckDiff[card.id] || 0) - card.quantity;
        });
        matchGameStats.forEach((stats, i) => {
          if (i !== 0) {
            let prevChanges = stats.sideboardChanges;
            prevChanges.added.forEach(
              id => (deckDiff[id] = (deckDiff[id] || 0) - 1)
            );
            prevChanges.removed.forEach(
              id => (deckDiff[id] = (deckDiff[id] || 0) + 1)
            );
          }
        });

        let sideboardChanges = {
          added: [],
          removed: []
        };
        Object.keys(deckDiff).forEach(id => {
          let quantity = deckDiff[id];
          for (let i = 0; i < quantity; i++) {
            sideboardChanges.added.push(id);
          }
          for (let i = 0; i > quantity; i--) {
            sideboardChanges.removed.push(id);
          }
        });

        game.sideboardChanges = sideboardChanges;
        game.deck = objectClone(currentMatch.player.deck.getSave());
      }

      game.handLands = game.handsDrawn.map(
        hand =>
          hand.filter(card => cardsDb.get(card).type.includes("Land")).length
      );
      let handSize = 8 - game.handsDrawn.length;
      let deckSize = 0;
      let landsInDeck = 0;
      let multiCardPositions = { "2": {}, "3": {}, "4": {} };
      let cardCounts = {};
      currentMatch.player.deck.mainboard.get().forEach(card => {
        cardCounts[card.id] = card.quantity;
        deckSize += card.quantity;
        if (card.quantity >= 2 && card.quantity <= 4) {
          multiCardPositions[card.quantity][card.id] = [];
        }
        let cardObj = cardsDb.get(card.id);
        if (cardObj && cardObj.type.includes("Land")) {
          landsInDeck += card.quantity;
        }
      });
      let librarySize = deckSize - handSize;
      let landsInLibrary =
        landsInDeck - game.handLands[game.handLands.length - 1];
      let landsSoFar = 0;
      let libraryLands = [];
      game.shuffledOrder.forEach((cardId, i) => {
        let cardCount = cardCounts[cardId];
        if (cardCount >= 2 && cardCount <= 4) {
          multiCardPositions[cardCount][cardId].push(i + 1);
        }
        if (i >= handSize) {
          let card = cardsDb.get(cardId);
          if (card && card.type.includes("Land")) {
            landsSoFar++;
          }
          libraryLands.push(landsSoFar);
        }
      });

      game.deckSize = deckSize;
      game.landsInDeck = landsInDeck;
      game.multiCardPositions = multiCardPositions;
      game.librarySize = librarySize;
      game.landsInLibrary = landsInLibrary;
      game.libraryLands = libraryLands;

      matchGameStats[gameNumberCompleted - 1] = game;

      saveMatch(mid);
    }
  }
}

function onLabelGreToClient(entry, json) {
  if (!json) return;
  if (skipMatch) return;
  logTime = parseWotcTime(entry.timestamp);

  json = json.greToClientEvent.greToClientMessages;
  json.forEach(function(msg) {
    let msgId = msg.msgId;
    greToClientInterpreter.GREMessage(msg, logTime);
    /*
    currentMatch.GREtoClient[msgId] = msg;
    currentMatch.latestMessage = msgId;
    greToClientInterpreter.GREMessageByID(msgId, logTime);
    */
  });
}

function onLabelClientToMatchServiceMessageTypeClientToGREMessage(entry, json) {
  //
  if (!json) return;
  if (skipMatch) return;
  if (json.Payload) {
    json.payload = json.Payload;
  }
  if (!json.payload) return;

  if (typeof json.payload == "string") {
    json.payload = decodePayload(json);
    json.payload = normaliseFields(json.payload);
  }

  if (json.payload.submitdeckresp) {
    // Get sideboard changes
    let deckResp = json.payload.submitdeckresp.deck;

    let tempMain = new CardsList(deckResp.deckcards);
    let tempSide = new CardsList(deckResp.sideboardcards);
    let newDeck = currentMatch.player.deck.clone();
    newDeck.mainboard = tempMain;
    newDeck.sideboard = tempSide;
    newDeck.mainboard.removeDuplicates();
    newDeck.sideboard.removeDuplicates();
    newDeck.getColors();

    currentMatch.player.deck = newDeck;
    console.log("> ", currentMatch.player.deck);
  }
}

function onLabelInEventGetPlayerCourse(entry, json) {
  if (!json) return;

  if (json.Id != "00000000-0000-0000-0000-000000000000") {
    json.date = parseWotcTime(entry.timestamp);
    json._id = json.Id;
    delete json.Id;

    if (json.CourseDeck) {
      json.CourseDeck.colors = get_deck_colors(json.CourseDeck);
      //json.date = timestamp();
      //console.log(json.CourseDeck, json.CourseDeck.colors)
      httpApi.httpSubmitCourse(json);
      saveCourse(json);
    }
    select_deck(json);
  }
}

function onLabelInEventGetPlayerCourseV2(entry, json) {
  if (!json) return;
  if (json.CourseDeck) {
    json.CourseDeck = convert_deck_from_v3(json.CourseDeck);
  }
  onLabelInEventGetPlayerCourse(entry, json);
}

function onLabelInEventGetCombinedRankInfo(entry, json) {
  if (!json) return;

  playerData.rank.constructed.rank = json.constructedClass;
  playerData.rank.constructed.tier = json.constructedLevel;
  playerData.rank.constructed.step = json.constructedStep;

  playerData.rank.limited.rank = json.limitedClass;
  playerData.rank.limited.tier = json.limitedLevel;
  playerData.rank.limited.step = json.limitedStep;

  playerData.rank.constructed.won = json.constructedMatchesWon;
  playerData.rank.constructed.lost = json.constructedMatchesLost;
  playerData.rank.constructed.drawn = json.constructedMatchesDrawn;

  playerData.rank.limited.won = json.limitedMatchesWon;
  playerData.rank.limited.lost = json.limitedMatchesLost;
  playerData.rank.limited.drawn = json.limitedMatchesDrawn;

  updateRank();
}

function onLabelInEventGetActiveEvents(entry, json) {
  if (!json) return;

  let activeEvents = json.map(event => event.InternalEventName);
  ipc_send("set_active_events", JSON.stringify(activeEvents));
}

function onLabelRankUpdated(entry, json) {
  if (!json) return;

  if (json.rankUpdateType == "Constructed") {
    playerData.rank.constructed.rank = json.newClass;
    playerData.rank.constructed.tier = json.newLevel;
    playerData.rank.constructed.step = json.newStep;
  } else {
    playerData.rank.limited.rank = json.newClass;
    playerData.rank.limited.tier = json.newLevel;
    playerData.rank.limited.step = json.newStep;
  }

  updateRank();
}

function onLabelInDeckGetDeckLists(entry, json) {
  if (!json) return;

  staticDecks = [];
  json.forEach(deck => {
    let deckId = deck.id;
    deck.tags = decks_tags[deckId];
    if (!deck.tags) deck.tags = [];

    decks[deckId] = deck;
    if (decks["index"].indexOf(deckId) == -1) {
      decks["index"].push(deck.id);
    }
    staticDecks.push(deck.id);
  });

  updateCustomDecks();
  requestHistorySend(0);
  ipc_send("set_decks", JSON.stringify(decks));
}

function onLabelInDeckGetDeckListsV3(entry, json) {
  if (!json) return;
  onLabelInDeckGetDeckLists(entry, json.map(d => convert_deck_from_v3(d)));
}

function onLabelInEventGetPlayerCourses(entry, json) {
  if (!json) return;

  json.forEach(course => {
    if (course.CurrentEventState != "PreMatch") {
      if (course.CourseDeck != null) {
        if (decks.index.indexOf(course.CourseDeck.id) == -1) {
          decks.index.push(course.CourseDeck.id);
        }
        decks[course.CourseDeck.id] = course.CourseDeck;
        updateCustomDecks();
        store.set("decks_index", decks.index);
        store.set("decks." + course.CourseDeck.id, course.CourseDeck);
      }
    }
  });
}

function onLabelInEventGetPlayerCoursesV2(entry, json) {
  if (!json) return;
  json.forEach(course => {
    if (course.CourseDeck) {
      course.CourseDeck = convert_deck_from_v3(course.CourseDeck);
    }
  });
  onLabelInEventGetPlayerCourses(entry, json);
}

function onLabelInDeckUpdateDeck(entry, json) {
  if (!json) return;
  logTime = parseWotcTime(entry.timestamp);

  decks.index.forEach(function(_deckid) {
    if (_deckid == json.id) {
      let _deck = decks[_deckid];
      var changeId = sha1(_deckid + "-" + logTime);
      var deltaDeck = {
        id: changeId,
        deckId: _deck.id,
        date: logTime,
        changesMain: [],
        changesSide: [],
        previousMain: _deck.mainDeck,
        previousSide: _deck.sideboard
      };

      // Check Mainboard
      _deck.mainDeck.forEach(function(card) {
        var cardObj = cardsDb.get(card.id);

        var diff = 0 - card.quantity;
        json.mainDeck.forEach(function(cardB) {
          var cardObjB = cardsDb.get(cardB.id);
          if (cardObj.name == cardObjB.name) {
            cardB.existed = true;
            diff = cardB.quantity - card.quantity;
          }
        });

        if (diff !== 0) {
          deltaDeck.changesMain.push({ id: card.id, quantity: diff });
        }
      });

      json.mainDeck.forEach(function(card) {
        if (card.existed == undefined) {
          let cardObj = cardsDb.get(card.id);
          deltaDeck.changesMain.push({ id: card.id, quantity: card.quantity });
        }
      });
      // Check sideboard
      _deck.sideboard.forEach(function(card) {
        var cardObj = cardsDb.get(card.id);

        var diff = 0 - card.quantity;
        json.sideboard.forEach(function(cardB) {
          var cardObjB = cardsDb.get(cardB.id);
          if (cardObj.name == cardObjB.name) {
            cardB.existed = true;
            diff = cardB.quantity - card.quantity;
          }
        });

        if (diff !== 0) {
          deltaDeck.changesSide.push({ id: card.id, quantity: diff });
        }
      });

      json.sideboard.forEach(function(card) {
        if (card.existed == undefined) {
          let cardObj = cardsDb.get(card.id);
          deltaDeck.changesSide.push({ id: card.id, quantity: card.quantity });
        }
      });

      if (!deck_changes_index.includes(changeId)) {
        deck_changes_index.push(changeId);
        deck_changes[changeId] = deltaDeck;

        store.set("deck_changes_index", deck_changes_index);
        store.set("deck_changes." + changeId, deltaDeck);
      }
    }
  });
}

function onLabelInDeckUpdateDeckV3(entry, json) {
  if (!json) return;
  onLabelInDeckUpdateDeck(entry, convert_deck_from_v3(json));
}

// Given a shallow object of numbers and lists return a
// new object which doesn't contain 0s or empty lists.
function minifiedDelta(delta) {
  let newDelta = {};
  Object.keys(delta).forEach(key => {
    let val = delta[key];
    if (val === 0 || (Array.isArray(val) && !val.length)) {
      return;
    }
    newDelta[key] = val;
  });
  return newDelta;
}

// Called for all "Inventory.Updated" labels
function onLabelInventoryUpdated(entry, transaction) {
  // if (!transaction) return;


  // Store this in case there are any future date parsing issues
  transaction.timestamp = entry.timestamp;

  // Add missing data
  transaction.date = parseWotcTime2(entry.timestamp);

  // hacky work around until date parsing for non-english languages is fixed.
  // FIXME: Sort out the parseWotcTime2 parsing
  let dateIsInvalid = !transaction.date || isNaN(transaction.date.getTime());
  if (dateIsInvalid) {
    console.log(`Invalid date ('${entry.timestamp}') - using current date as backup.`);
    transaction.date = new Date();
  }

  // Reduce the size for storage
  transaction.delta = minifiedDelta(transaction.delta);

  // Construct a unique ID
  let context = transaction.context;
  let milliseconds = transaction.date.getTime();
  transaction.id = sha1(milliseconds + context);

  // Do not modify the context from now on.
  saveEconomyTransaction(transaction);
  return;
}

function onLabelInPlayerInventoryGetPlayerInventory(entry, json) {
  if (!json) return;
  logTime = parseWotcTime(entry.timestamp);

  gold = json.gold;
  gems = json.gems;
  vault = json.vaultProgress;
  wcTrack = json.wcTrackPosition;
  wcCommon = json.wcCommon;
  wcUncommon = json.wcUncommon;
  wcRare = json.wcRare;
  wcMythic = json.wcMythic;

  sendEconomy();
}

function onLabelInPlayerInventoryGetPlayerCardsV3(entry, json) {
  if (!json) return;

  var date = new Date(store.get("cards.cards_time"));
  var now = new Date();
  var diff = Math.abs(now.getTime() - date.getTime());
  var days = Math.floor(diff / (1000 * 3600 * 24));

  if (store.get("cards.cards_time") == 0) {
    store.set("cards.cards_time", now);
    store.set("cards.cards_before", json);
    store.set("cards.cards", json);
  }
  // If a day has passed since last update
  else if (days > 0) {
    var cardsPrev = store.get("cards.cards");
    store.set("cards.cards_time", now);
    store.set("cards.cards_before", cardsPrev);
    store.set("cards.cards", json);
  }

  var cardsPrevious = store.get("cards.cards_before");
  var cardsNewlyAdded = {};

  Object.keys(json).forEach(function(key) {
    // get differences
    if (cardsPrevious[key] == undefined) {
      cardsNewlyAdded[key] = json[key];
    } else if (cardsPrevious[key] < json[key]) {
      cardsNewlyAdded[key] = json[key] - cardsPrevious[key];
    }
  });

  ipc_send("set_cards", { cards: json, new: cardsNewlyAdded });
}

function onLabelInEventDeckSubmit(entry, json) {
  if (!json) return;
  select_deck(json);
}

function onLabelInEventDeckSubmitV3(entry, json) {
  if (!json) return;
  onLabelInEventDeckSubmit(entry, convert_deck_from_v3(json));
}

function onLabelEventMatchCreated(entry, json) {
  if (!json) return;
  matchBeginTime = parseWotcTime(entry.timestamp);

  if (json.opponentRankingClass == "Mythic") {
    httpApi.httpSetMythicRank(
      json.opponentScreenName,
      json.opponentMythicLeaderboardPlace
    );
  }

  ipc_send("ipc_log", "MATCH CREATED: " + matchBeginTime);
  if (json.eventId != "NPE") {
    createMatch(json);
  }
}

function onLabelOutDirectGameChallenge(entry, json) {
  if (!json) return;
  var deck = json.params.deck;

  deck = replaceAll(deck, '"Id"', '"id"');
  deck = replaceAll(deck, '"Quantity"', '"quantity"');
  deck = JSON.parse(deck);
  select_deck(deck);

  httpApi.httpTournamentCheck(deck, json.params.opponentDisplayName, false, json.params.playFirst, json.params.bo3);
}

function onLabelOutEventAIPractice(entry, json) {
  if (!json) return;
  var deck = json.params.deck;

  deck = replaceAll(deck, '"Id"', '"id"');
  deck = replaceAll(deck, '"Quantity"', '"quantity"');
  deck = JSON.parse(deck);
  select_deck(deck);
}

function onLabelInDraftDraftStatus(entry, json) {
  if (!json) return;

  if (json.eventName != undefined) {
    for (let set in setsList) {
      let setCode = setsList[set]["code"];
      if (json.eventName.indexOf(setCode) !== -1) {
        draftSet = set;
      }
    }
  }

  if (
    currentDraft == undefined ||
    (json.packNumber == 0 && json.pickNumber <= 0)
  ) {
    createDraft();
  }
  currentDraft.packNumber = json.packNumber;
  currentDraft.pickNumber = json.pickNumber;
  currentDraft.pickedCards = json.pickedCards;
  currentDraft.currentPack = json.draftPack.slice(0);
  setDraftCards(currentDraft);
}

function onLabelInDraftMakePick(entry, json) {
  if (!json) return;
  // store pack in recording
  if (json.eventName != undefined) {
    for (let set in setsList) {
      let setCode = setsList[set]["code"];
      if (json.eventName.indexOf(setCode) !== -1) {
        currentDraft.set = set;
      }
    }
  }

  if (json.draftPack != undefined) {
    if (currentDraft == undefined) {
      createDraft();
    }
    currentDraft.packNumber = json.packNumber;
    currentDraft.pickNumber = json.pickNumber;
    currentDraft.pickedCards = json.pickedCards;
    currentDraft.currentPack = json.draftPack.slice(0);
    setDraftCards(currentDraft);
  }
}

function onLabelOutDraftMakePick(entry, json) {
  if (!json) return;
  // store pick in recording
  var value = {};
  value.pick = json.params.cardId;
  value.pack = currentDraft.currentPack;
  var key = "pack_" + json.params.packNumber + "pick_" + json.params.pickNumber;
  currentDraft[key] = value;
}

function onLabelInEventCompleteDraft(entry, json) {
  if (!json) return;
  ipc_send("save_overlay_pos", 1);
  clear_deck();
  if (!store.get("settings.show_overlay_always")) {
    ipc_send("overlay_close", 1);
  }
  //ipc_send("renderer_show", 1);

  currentDraft.draftId = json.Id;
  console.log("Complete draft", json);
  saveDraft();
}

function onLabelMatchGameRoomStateChangedEvent(entry, json) {
  if (!json) return;

  json = json.matchGameRoomStateChangedEvent.gameRoomInfo;
  let eventId = "";

  if (json.gameRoomConfig) {
    eventId = json.gameRoomConfig.eventId;
    duringMatch = true;
  }

  if (eventId == "NPE") return;

  if (json.stateType == "MatchGameRoomStateType_Playing") {
    json.gameRoomConfig.reservedPlayers.forEach(player => {
      if (player.userId == playerData.arenaId) {
        currentMatch.player.seat = player.systemSeatId;
      } else {
        currentMatch.opponent.name = player.playerName;
        currentMatch.opponent.id = player.userId;
        currentMatch.opponent.seat = player.systemSeatId;
      }
    });
  }
  if (json.stateType == "MatchGameRoomStateType_MatchCompleted") {
    playerWin = 0;
    draws = 0;
    oppWin = 0;
    currentMatch.results = json.finalMatchResult.resultList;

    json.finalMatchResult.resultList.forEach(function(res) {
      if (res.scope == "MatchScope_Game") {
        if (res.result == "ResultType_Draw") {
          draws += 1;
        } else {
          if (res.winningTeamId == currentMatch.player.seat) {
            playerWin += 1;
          }
          if (res.winningTeamId == currentMatch.opponent.seat) {
            oppWin += 1;
          }
        }
      }
      if (res.scope == "MatchScope_Match") {
        skipMatch = false;
        duringMatch = false;
      }
    });

    ipc_send("save_overlay_pos", 1);
    clear_deck();
    if (!store.get("settings.show_overlay_always")) {
      ipc_send("overlay_close", 1);
    }
    matchCompletedOnGameNumber = json.finalMatchResult.resultList.length - 1;
    saveMatch(json.finalMatchResult.matchId + "-" + playerData.arenaId);
  }

  if (json.players) {
    json.players.forEach(function(player) {
      if (player.userId == playerData.arenaId) {
        currentMatch.player.seat = player.systemSeatId;
      } else {
        oppId = player.userId;
        currentMatch.opponent.seat = player.systemSeatId;
      }
    });
  }
}

function onLabelInEventGetSeasonAndRankDetail(entry, json) {
  if (!json) return;

  season_starts = new Date(json.currentSeason.seasonStartTime);
  season_ends = new Date(json.currentSeason.seasonEndTime);

  json.constructedRankInfo.forEach(rank => {
    if (
      rank.rankClass == playerData.rank.constructed.rank &&
      rank.level == playerData.rank.constructed.tier
    ) {
      playerData.rank.constructed.steps = rank.steps;
    }
  });

  json.limitedRankInfo.forEach(rank => {
    if (
      rank.rankClass == playerData.rank.limited.rank &&
      rank.level == playerData.rank.limited.tier
    ) {
      playerData.rank.limited.steps = rank.steps;
    }
  });

  ipc_send("set_season", { starts: season_starts, ends: season_ends });
  updateRank();
}

function onLabelGetPlayerInventoryGetRewardSchedule(entry, json) {
  if (!json) return;

  if (!json.dailyReset.endsWith("Z")) json.dailyReset = json.dailyReset + "Z";
  if (!json.weeklyReset.endsWith("Z"))
    json.weeklyReset = json.weeklyReset + "Z";

  ipc_send("set_reward_resets", {
    daily: json.dailyReset,
    weekly: json.weeklyReset
  });
}
