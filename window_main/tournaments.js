/*
global
  $$,
  addCardSeparator,
  addCardTile,
  change_background,
  createDivision,
  compare_cards,
  decks,
  drawDeck,
  drawDeckVisual,
  get_deck_export,
  ipc_send,
  makeId,
  objectClone,
  pop,
  playerData,
  timestamp,
  toHHMMSS,
  userName,
*/

let tournamentDeck = null;
let currentDeck = null;
let originalDeck = null;
let tou = null;

let touStates = {};

let stateClockInterval = null;
let lastSeenInterval = null;

function tournamentCreate() {
  $(".moving_ux").animate({ left: "-100%" }, 250, "easeInOutCubic");
  let mainDiv = $$("#ux_1")[0];
  mainDiv.innerHTML = "";
  // Top navigation stuff
  let top = createDivision(["decklist_top"]);
  let buttonBack = createDivision(["button", "back"]);
  let topTitle = createDivision(["deck_name"], "Create Tournament");
  let topStatus = createDivision(["tou_top_status"]);
  top.appendChild(buttonBack);
  top.appendChild(topTitle);
  top.appendChild(topStatus);

  // Append
  mainDiv.appendChild(top);
  buttonBack.addEventListener("click", () => {
    change_background("default");
    $(".moving_ux").animate({ left: "0px" }, 250, "easeInOutCubic");
  });
}

function tournamentOpen(t) {
  //console.log(t);
  tou = t;
  let mainDiv = $$("#ux_1")[0];
  mainDiv.innerHTML = "";

  let sd = tou.signupDuration;
  let rd = tou.roundDuration;
  let roundsStart = tou.starts + sd * 60 * 60;
  let roundEnd =
    tou.starts + sd * 60 * 60 + (tou.currentRound + 1) * 60 * 60 * rd;

  if (tou.deck) {
    currentDeck = tou.deck;
    originalDeck = objectClone(tou.deck);
  }

  let joined = false;
  let record = "-";
  let stats;
  if (tou.players.indexOf(playerData.name) !== -1) {
    joined = true;
    stats = tou.playerStats[playerData.name];
    record = stats.w + " - " + stats.d + " - " + stats.l;
  }

  let topButtonBack = createDivision(["button", "back"]);
  let topDeckName = createDivision(["deck_name"], tou.name);
  let top = createDivision(["decklist_top"]);
  top.appendChild(topButtonBack);
  top.appendChild(topDeckName);

  flr = createDivision(["tou_top_status", "state_clock"]);
  flr.style.alignSelf = "center";

  let state = "";
  if (stateClockInterval !== null) clearInterval(stateClockInterval);
  if (tou.state == -1) {
    state = "";
    stateClockInterval = window.setInterval(() => {
      let tst = timestamp();
      $$(".state_clock")[0].innerHTML =
        "Registration begin in " + toHHMMSS(tst - tou.starts);
    }, 1000);
  }
  if (tou.state == 0) {
    state = "";
    stateClockInterval = window.setInterval(() => {
      let tst = timestamp();
      if (joined) {
        $$(".state_clock")[0].innerHTML =
          "Starts in " + toHHMMSS(roundsStart - tst);
      } else {
        $$(".state_clock")[0].innerHTML =
          toHHMMSS(roundsStart - tst) + " left to register.";
      }
    }, 1000);
  }
  if (tou.state == 1) {
    state = "";
    stateClockInterval = window.setInterval(() => {
      let tst = timestamp();
      $$(".state_clock")[0].innerHTML = `Round ${tou.currentRound +
        1} ends in ${toHHMMSS(roundEnd - tst)}`;
    }, 1000);
  }
  if (tou.state == 3) {
    state = "";
    $$(".state_clock")[0].innerHTML = "Top " + tou.top;
  }
  if (tou.state == 4) {
    state = "Tournament finish.";
  }

  flr.innerHTML = state;
  top.appendChild(flr);
  mainDiv.appendChild(top);

  let desc = createDivision(["tou_desc"], tou.desc);
  desc.style.alignSelf = "center";
  mainDiv.appendChild(desc);

  if (tou.state <= 0) {
    showTournamentRegister(mainDiv, tou);
  } else {
    showTournamentStarted(mainDiv, tou);
  }

  topButtonBack.addEventListener("click", () => {
    change_background("default");
    $(".moving_ux").animate({ left: "0px" }, 250, "easeInOutCubic");
  });
}

function showTournamentRegister(mainDiv, tou) {
  let joined = false;
  if (tou.players.indexOf(playerData.name) !== -1) {
    joined = true;
  }

  let buttonDrop, buttonJoin;
  if (joined) {
    let deckContainer = createDivision(["flex_item"]);
    let deckvisual = createDivision(["decklist"]);
    deckContainer.appendChild(deckvisual);

    mainDiv.appendChild(deckContainer);
    if (tou.deck) {
      drawDeckVisual(deckvisual, undefined, tou.deck);
    }

    if (tou.state !== 4) {
      buttonDrop = createDivision(["button_simple", "but_drop"], "Drop");
      mainDiv.appendChild(buttonDrop);
    }
  } else {
    let deckSelectContainer = createDivision(["flex_item"]);

    let decksList = decks.map((d, index) => index);
    //select.append(`<option value="${_deck.id}">${_deck.name}</option>`);

    let deckSelect = createSelect(
      deckSelectContainer,
      decksList,
      -1,
      selectTourneyDeck,
      "tou_deck_select",
      index => {
        return decks[index].name;
      }
    );

    deckSelect.style.width = "300px";
    deckSelect.style.margin = "16px auto";
    mainDiv.appendChild(deckSelect);

    if (tou.state == 0) {
      if (tou.password) {
        let cont = createDivision([
          "input_login_container",
          "tourney_pwd_container"
        ]);

        let lockIcon = createDivision(["status_locked", "input_lock"]);

        let pwdInput = document.createElement("input");
        pwdInput.id = "tourney_pass";
        pwdInput.autocomplete = "off";
        pwdInput.type = "password";

        let lockedMsg = createDivision(
          ["tou_desc"],
          "This tournament is password protected."
        );
        lockedMsg.style.margin = "32px 0 0px 0px";
        mainDiv.appendChild(lockedMsg);

        cont.appendChild(lockIcon);
        cont.appendChild(pwdInput);
        mainDiv.appendChild(cont);
      }

      buttonJoin = createDivision(
        ["button_simple_disabled", "but_join"],
        "Join"
      );
      mainDiv.appendChild(buttonJoin);
    }

    let joinDecklist = createDivision(["join_decklist"]);
    mainDiv.appendChild(joinDecklist);
  }

  let list = createDivision(["tou_list_players"]);
  let pJoined = createDivision(
    ["tou_list_player_name", "tou_list_player_name_title"],
    "Players joined:"
  );
  list.appendChild(pJoined);

  tou.players.forEach(p => {
    let pName = createDivision(["tou_list_player_name"], p.slice(0, -6));
    list.appendChild(pName);
  });
  list.appendChild(document.createElement("br"));
  mainDiv.appendChild(list);

  if (buttonJoin) {
    buttonJoin.addEventListener("click", () => {
      if (buttonJoin.classList.contains("button_simple")) {
        if (tou.password) {
          let pwd = document.getElementById("tourney_pass").value;
          tournamentJoin(tou._id, tournamentDeck, pwd);
        } else {
          tournamentJoin(tou._id, tournamentDeck, "");
        }
      }
    });
  }

  if (buttonDrop) {
    buttonDrop.addEventListener("click", () => {
      ipc_send("tou_drop", tou._id);
    });
  }
}

function tournamentJoin(_id, _deck, _pass) {
  ipc_send("tou_join", { id: _id, deck: _deck, pass: _pass });
}

function showTournamentStarted(mainDiv, tou) {
  let joined = false;
  if (tou.players.indexOf(playerData.name) !== -1) {
    joined = true;
    stats = tou.playerStats[playerData.name];
    record = stats.w + " - " + stats.d + " - " + stats.l;
  }

  if (tou.state !== 4) {
    $(`<div class="tou_reload"></div>`).appendTo(mainDiv);
  }
  if (joined) {
    $(`<div class="tou_record green">${record}</div>`).appendTo(mainDiv);
    if (tou.state !== 4) {
      $(
        `<div class="tou_opp"><span>On MTGA: </span><span style="margin-left: 10px; color: rgb(250, 229, 210);">${
          tou.current_opponent
        }</span><div class="copy_button copy_mtga"></div></div>`
      ).appendTo(mainDiv);
      $(
        `<div class="tou_opp"><span>On Discord: </span><span style="margin-left: 10px; color: rgb(250, 229, 210);">${
          tou.current_opponent_discord
        }</span><div class="copy_button copy_discord"></div></div>`
      ).appendTo(mainDiv);
      $(
        `<div class="tou_opp tou_opp_sub"><span class="last_seen_clock"></span></div></div>`
      ).appendTo(mainDiv);
    }

    if (lastSeenInterval !== null) clearInterval(lastSeenInterval);
    if (tou.current_opponent_last !== tou.server_time) {
      lastSeenInterval = window.setInterval(() => {
        let tst = timestamp();
        let diff = tst - tou.current_opponent_last;
        $(".last_seen_clock").html(`Last seen ${toHHMMSS(diff)} ago.`);
      }, 250);
    }

    if (
      tou.state !== 4 &&
      tou.current_opponent !== "bye" &&
      tou.current_opponent !== ""
    ) {
      let checks = $(`<div class="tou_checks"></div>`);
      generateChecks(tou.current_check, tou.current_seat).appendTo(checks);
      checks.appendTo(mainDiv);
    }

    $(".copy_mtga").click(() => {
      pop("Copied to clipboard", 1000);
      ipc_send("set_clipboard", tou.current_opponent);
    });

    $(".copy_discord").click(() => {
      pop("Copied to clipboard", 1000);
      ipc_send("set_clipboard", tou.current_opponent_discord);
    });
  }

  let tabs = $('<div class="tou_tabs_cont"></div>');
  let tab_rounds = $(
    '<div class="tou_tab tab_a tou_tab_selected">Rounds</div>'
  );
  let tab_standings = $('<div class="tou_tab tab_b ">Standings</div>');

  tab_rounds.appendTo(tabs);
  tab_standings.appendTo(tabs);
  if (joined) {
    let tab_decklist = $('<div class="tou_tab tab_c">Decklist</div>');
    tab_decklist.appendTo(tabs);
    /*
    if (tou.current_opponent !== '' && tou.current_opponent !== 'bye') {
      let tab_chat = $('<div class="tou_tab tab_d">Chat</div>');
      tab_chat.appendTo(tabs);
    }
    */
  }

  tabs.appendTo(mainDiv);

  let tab_cont_a = $('<div class="tou_cont_a"></div>');

  // DRAW TOP 8
  if (tou.top > 0 && tou.state >= 3) {
    $(`<div class="tou_round_title">Top ${tou.top}</div>`).appendTo(tab_cont_a);

    let top_matches = [];
    let top_cont = $('<div class="tou_top"></div>');
    let m;
    let tou_cont_a = $('<div class="tou_top_cont"></div>');
    let tou_cont_b = $('<div class="tou_top_cont"></div>');
    let tou_cont_c = $('<div class="tou_top_cont"></div>');

    if (tou.top >= 2) {
      m = $('<div class="tou_match_cont top_0"></div>');
      top_matches.push(m);
      m.appendTo(tou_cont_c);
    }
    if (tou.top >= 4) {
      m = $('<div class="tou_match_cont top_1"></div>');
      top_matches.push(m);
      m.appendTo(tou_cont_b);
      m = $('<div class="tou_match_cont top_2"></div>');
      top_matches.push(m);
      m.appendTo(tou_cont_b);
    }
    if (tou.top >= 8) {
      m = $('<div class="tou_match_cont top_3"></div>');
      top_matches.push(m);
      m.appendTo(tou_cont_a);
      m = $('<div class="tou_match_cont top_4"></div>');
      top_matches.push(m);
      m.appendTo(tou_cont_a);
      m = $('<div class="tou_match_cont top_5"></div>');
      top_matches.push(m);
      m.appendTo(tou_cont_a);
      m = $('<div class="tou_match_cont top_6"></div>');
      top_matches.push(m);
      m.appendTo(tou_cont_a);
    }
    if (tou.top >= 8) tou_cont_a.appendTo(top_cont);
    if (tou.top >= 4) tou_cont_b.appendTo(top_cont);
    if (tou.top >= 2) tou_cont_c.appendTo(top_cont);
    top_cont.appendTo(tab_cont_a);

    tou["round_top"].forEach(function(match) {
      if (match.p1 == "") {
        match.p1 = "TBD#00000";
      }
      if (match.p2 == "") {
        match.p2 = "TBD#00000";
      }
      let cont = top_matches[match.id];

      let p1wc = "";
      let p2wc = "";
      if (match.winner == 1) {
        p1wc = "tou_score_win";
      }
      if (match.winner == 2) {
        p2wc = "tou_score_win";
      }

      let d1 = "";
      let d2 = "";
      if (match.p2 == "bye") match.p2 = "BYE#00000";
      try {
        if (match.drop1) d1 = " (drop)";
        if (match.drop2) d2 = " (drop)";
      } catch (e) {
        console.error(e);
      }

      let s = "";
      if (match.p1 == userName) s = 'style="color: rgba(183, 200, 158, 1);"';
      if (match.p1 == "TBD#00000")
        s = 'style="color: rgba(250, 229, 210, 0.65);"';

      let p1 = $(
        `<div ${s} class="tou_match_p ${match.p1}pn">${match.p1.slice(0, -6) +
          d1}<div class="${p1wc} tou_match_score">${match.p1w}</div></div>`
      );
      s = "";
      if (match.p2 == userName) s = 'style="color: rgba(183, 200, 158, 1);"';
      if (match.p2 == "TBD#00000")
        s = 'style="color: rgba(250, 229, 210, 0.65);"';
      let p2 = $(
        `<div ${s} class="tou_match_p ${match.p2}pn">${match.p2.slice(0, -6) +
          d2}<div class="${p2wc} tou_match_score">${match.p2w}</div></div>`
      );

      p1.appendTo(cont);
      p2.appendTo(cont);
    });
  }

  // DRAW ROUNDS
  for (let i = tou.currentRound; i >= 0; i--) {
    let rname = "round_" + i;
    if (tou[rname] !== undefined) {
      $(`<div class="tou_round_title">Round ${i + 1}</div>`).appendTo(
        tab_cont_a
      );
      let round_cont = $('<div class="tou_round_cont"></div>');

      tou[rname].forEach(function(match) {
        let cont = $('<div class="tou_match_cont"></div>');
        let p1wc = "";
        let p2wc = "";
        if (match.winner == 1) {
          p1wc = "tou_score_win";
        }
        if (match.winner == 2) {
          p2wc = "tou_score_win";
        }

        let d1 = "";
        let d2 = "";
        if (match.p2 == "bye") match.p2 = "BYE#00000";
        try {
          if (match.drop1) d1 = " (drop)";
          if (match.drop2) d2 = " (drop)";
        } catch (e) {
          console.error(e);
        }

        let s = "";
        if (match.p1 == playerData.name)
          s = 'style="color: rgba(183, 200, 158, 1);"';
        let p1 = $(
          `<div ${s} class="tou_match_p ${match.p1}pn">${match.p1.slice(0, -6) +
            d1}<div class="${p1wc} tou_match_score">${match.p1w}</div></div>`
        );
        s = "";
        if (match.p2 == playerData.name)
          s = 'style="color: rgba(183, 200, 158, 1);"';
        if (match.p2 == "BYE#00000")
          s = 'style="color: rgba(250, 229, 210, 0.65);"';
        let p2 = $(
          `<div ${s} class="tou_match_p ${match.p2}pn">${match.p2.slice(0, -6) +
            d2}<div class="${p2wc} tou_match_score">${match.p2w}</div></div>`
        );

        p1.appendTo(cont);
        p2.appendTo(cont);
        cont.appendTo(round_cont);
      });
      round_cont.appendTo(tab_cont_a);
    }
  }

  // DRAW DROP
  if (joined) {
    $('<div class="button_simple but_drop">Drop</div>').appendTo(tab_cont_a);
  }

  // SORT PLAYERS
  let tab_cont_b = $('<div class="tou_cont_b" style="height: 0px"></div>');
  tou.players.sort(function(a, b) {
    if (tou.playerStats[a].mp > tou.playerStats[b].mp) return -1;
    else if (tou.playerStats[a].mp < tou.playerStats[b].mp) return 1;
    else {
      if (tou.playerStats[a].omwp > tou.playerStats[b].omwp) return -1;
      else if (tou.playerStats[a].omwp < tou.playerStats[b].omwp) return 1;
      else {
        if (tou.playerStats[a].gwp > tou.playerStats[b].gwp) return -1;
        else if (tou.playerStats[a].gwp < tou.playerStats[b].gwp) return 1;
        else {
          if (tou.playerStats[a].ogwp > tou.playerStats[b].ogwp) return -1;
          else if (tou.playerStats[a].ogwp < tou.playerStats[b].ogwp) return 1;
        }
      }
    }
    return 0;
  });

  let desc = $(
    `<div class="tou_desc" style="align-self: center;">Points are updated only when a round ends.</div>`
  );
  desc.appendTo(tab_cont_b);

  let line = $('<div class="tou_stand_line_title line_dark"></div>');
  $(`
    <div class="tou_stand_small">Pos</div>
    <div class="tou_stand_name" style="width: 206px;">Name</div>
    <div class="tou_stand_cell">Points</div>
    <div class="tou_stand_cell">Score</div>
    <div class="tou_stand_cell">Matches</div>
    <div class="tou_stand_cell">Games</div>
    <div class="tou_stand_cell">OMW</div>
    <div class="tou_stand_cell">GW</div>
    <div class="tou_stand_cell">OGW</div>
  `).appendTo(line);
  line.appendTo(tab_cont_b);

  // DRAW STANDINGS
  tou.players.forEach(function(pname, index) {
    let stat = tou.playerStats[pname];
    if (index % 2) {
      line = $('<div class="tou_stand_line line_dark"></div>');
    } else {
      line = $('<div class="tou_stand_line"></div>');
    }

    let s = "";
    if (pname == playerData.name) s = 'style="color: rgba(183, 200, 158, 1);"';

    let str = `
    <div class="tou_stand_small">${index + 1}</div>
    <img src="blank.gif" class="flag tou_flag flag-${tou.flags[
      pname
    ].toLowerCase()}" />
    <div ${s} class="tou_stand_name">${pname.slice(0, -6)} ${
      tou.drops.indexOf(pname) !== -1 ? " (drop)" : ""
    }</div>
    <div class="tou_stand_cell">${stat.mp}</div>
    <div class="tou_stand_cell">${stat.w}-${stat.d}-${stat.l}</div>
    <div class="tou_stand_cell">${stat.rpl}</div>
    <div class="tou_stand_cell">${stat.gpl}</div>
    <div class="tou_stand_cell">${Math.round(stat.omwp * 10000) / 100}%</div>
    <div class="tou_stand_cell">${Math.round(stat.gwp * 10000) / 100}%</div>
    <div class="tou_stand_cell">${Math.round(stat.ogwp * 10000) / 100}%</div>`;

    $(str).appendTo(line);
    line.appendTo(tab_cont_b);
  });

  // DRAW DECK (ex sideboarder)
  tab_cont_a.appendTo(mainDiv);
  tab_cont_b.appendTo(mainDiv);
  if (joined) {
    let tab_cont_c = $('<div class="tou_cont_c" style="height: 0px"></div>');
    let decklistCont = $('<div class="sideboarder_container"></div>');

    $('<div class="button_simple exportDeck">Export to Arena</div>').appendTo(
      tab_cont_c
    );
    decklistCont.appendTo(tab_cont_c);

    tab_cont_c.appendTo(mainDiv);

    drawSideboardDeck();

    $(".exportDeck").click(() => {
      let list = get_deck_export(currentDeck);
      ipc_send("set_clipboard", list);
    });
  }

  $(".tou_tab").click(function() {
    if (!$(this).hasClass("tou_tab_selected")) {
      $(".tou_tab").each(function() {
        $(this).removeClass("tou_tab_selected");
      });
      $(this).addClass("tou_tab_selected");
      $(".tou_cont_a").css("height", "0px");
      $(".tou_cont_b").css("height", "0px");
      $(".tou_cont_c").css("height", "0px");
      $(".tou_cont_d").css("height", "0px");
      if ($(this).hasClass("tab_a")) {
        $(".tou_cont_a").css("height", "auto");
      }
      if ($(this).hasClass("tab_b")) {
        $(".tou_cont_b").css("height", "auto");
      }
      if ($(this).hasClass("tab_c")) {
        $(".tou_cont_c").css("height", "auto");
      }
      if ($(this).hasClass("tab_d")) {
        $(".tou_cont_d").css("height", "auto");
      }
    }
  });

  if (joined) {
    $(".tou_reload").click(() => {
      tournamentOpen(tou);
    });
    $(".but_drop").click(() => {
      ipc_send("tou_drop", tou._id);
    });
  }
}

function tournamentSetState(state) {
  touStates[state.tid] = state;
  if (state.tid == tou._id) {
    $(".tou_checks").html("");
    $(".tou_checks").append(
      generateChecks(state.check, state.game, state.seat)
    );
  }
}

function generateChecks(state, seat) {
  let checks = $('<div class="tou_check_cont"></div>');
  state.forEach((c, index) => {
    let ch;
    let ss = index % 2;
    ch = $(
      `<div title="${
        ss == seat ? "You" : tou.current_opponent.slice(0, -6)
      }" class="tou_check ${c ? "green_bright_bg" : "red_bright_bg"}"></div>`
    );
    ch.appendTo(checks);
  });

  return checks;
}

function selectTourneyDeck(index) {
  let _deck = decks[index];
  tournamentDeck = _deck.id;
  _deck.mainDeck.sort(compare_cards);
  _deck.sideboard.sort(compare_cards);
  // drawDeck requires a jquery div... mmm
  drawDeck($(".join_decklist"), _deck, true);

  $$(".but_join")[0].classList.add("button_simple");
}

function drawSideboardDeck() {
  let unique = makeId(4);
  let _div = $(".sideboarder_container");
  _div.html("");
  _div.css("dsiplay", "flex");
  let mainboardDiv = $('<div class="decklist_divided"></dii>');

  currentDeck.mainDeck.sort(compare_cards);
  currentDeck.sideboard.sort(compare_cards);

  let size = 0;
  currentDeck.mainDeck.forEach(function(card) {
    size += card.quantity;
  });
  addCardSeparator(`Mainboard (${size})`, mainboardDiv);
  currentDeck.mainDeck.forEach(function(card) {
    let grpId = card.id;

    if (card.quantity > 0) {
      let tile = addCardTile(grpId, unique + "a", card.quantity, mainboardDiv);
    }
  });

  let sideboardDiv = $('<div class="decklist_divided"></dii>');

  if (currentDeck.sideboard != undefined) {
    if (currentDeck.sideboard.length > 0) {
      size = 0;
      currentDeck.sideboard.forEach(function(card) {
        size += card.quantity;
      });
      addCardSeparator(`Sideboard (${size})`, sideboardDiv);

      currentDeck.sideboard.forEach(function(card) {
        let grpId = card.id;
        if (card.quantity > 0) {
          let tile = addCardTile(
            grpId,
            unique + "b",
            card.quantity,
            sideboardDiv
          );
        }
      });
    }
  }

  _div.append(mainboardDiv);
  _div.append(sideboardDiv);
}

module.exports = {
  tournamentOpen: tournamentOpen,
  tournamentCreate: tournamentCreate,
  tournamentSetState: tournamentSetState
};
