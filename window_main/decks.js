/*
global
	decks,
	sidebarActive,
	cardsDb,
	sort_decks,
	cards,
	getDeckWinrate,
  getReadableFormat,
	open_deck,
	tags_colors,
	ipc_send,
	selectAdd,
  getBoosterCountEstimate
*/

let filterTag = "All";

//
function open_decks_tab() {
  if (sidebarActive == 0 && decks != null) {
    sort_decks();
    var mainDiv = document.getElementById("ux_0");
    mainDiv.classList.remove("flex_item");
    mainDiv.innerHTML = "";
    var d = document.createElement("div");
    d.classList.add("list_fill");
    mainDiv.appendChild(d);

    // Tags and filters
    let decks_top = document.createElement("div");
    decks_top.classList.add("decks_top");

    let decks_top_filter = document.createElement("div");
    decks_top_filter.classList.add("decks_top_filter");

    const tagSet = new Set();
    const formatSet = new Set();
    const counts = {};
    decks.forEach(deck => {
      if (deck.tags) {
        deck.tags.forEach(tag => {
          tagSet.add(tag);
          counts[tag] = (counts[tag] || 0) + 1;
        });
      }
      if (deck.format) {
        formatSet.add(deck.format);
        counts[deck.format] = (counts[deck.format] || 0) + 1;
      }
    });
    const tagList = [...tagSet].filter(
      tag => tag !== filterTag && !formatSet.has(tag)
    );
    tagList.sort(); // alpha sort instead of counts for now
    const formatList = [...formatSet].filter(format => format !== filterTag);
    formatList.sort((a, b) => counts[b] - counts[a]);

    var select = $('<select id="query_select"></select>');
    if (filterTag !== "All") {
      select.append('<option value="All">All</option>');
    }
    tagList.forEach(tag =>
      select.append('<option value="' + tag + '">' + tag + "</option>")
    );
    formatList.forEach(f =>
      select.append(
        '<option value="' + f + '">' + getReadableFormat(f) + "</option>"
      )
    );

    decks_top_filter.appendChild(select[0]);
    selectAdd(select, filterDecks);
    select.next("div.select-styled").text(getReadableFormat(filterTag));

    let decks_top_winrate = document.createElement("div");
    decks_top_winrate.classList.add("decks_top_winrate");

    decks_top.appendChild(decks_top_filter);
    decks_top.appendChild(decks_top_winrate);
    mainDiv.appendChild(decks_top);

    let wrTotalWins = 0;
    let wrTotalLosses = 0;
    let wrTotal = 0;
    decks.forEach(function(deck, index) {
      var tileGrpid = deck.deckTileId;

      let showDeck = false;
      if (filterTag === "All") {
        showDeck = true;
      }
      if (deck.tags) {
        showDeck = showDeck || deck.tags.indexOf(filterTag) !== -1;
      }
      if (deck.format) {
        showDeck = showDeck || deck.format === filterTag;
      }

      if (showDeck) {
        if (cardsDb.get(tileGrpid).set == undefined) {
          tileGrpid = 67003;
        }

        var tile = document.createElement("div");
        tile.classList.add(deck.id + "t");
        tile.classList.add("deck_tile");

        try {
          tile.style.backgroundImage =
            "url(https://img.scryfall.com/cards" +
            cardsDb.get(tileGrpid).images["art_crop"] +
            ")";
        } catch (e) {
          console.error(e);
        }

        var div = document.createElement("div");
        div.classList.add(deck.id);
        div.classList.add("list_deck");

        var fll = document.createElement("div");
        fll.classList.add("flex_item");

        var flc = document.createElement("div");
        flc.classList.add("flex_item");
        flc.style.flexDirection = "column";
        flc.style.whiteSpace = "nowrap";

        var flcf = document.createElement("div");
        flcf.classList.add("deck_tags_container");

        var flcfwc = document.createElement("div");
        flcfwc.style.marginRight = "8px";
        flcfwc.classList.add("flex_item");

        const t = createTag(null, flcf, false);
        jQuery.data(t, "deck", deck.id);
        if (deck.format) {
          const fText = getReadableFormat(deck.format);
          const t = createTag(fText, flcf, false);
          t.style.fontStyle = "italic";
          jQuery.data(t, "deck", deck.id);
        }
        if (deck.tags) {
          deck.tags.forEach(tag => {
            if (tag !== deck.format) {
              const t = createTag(tag, flcf);
              jQuery.data(t, "deck", deck.id);
            }
          });
        }

        // Deck crafting cost section
        let ownedWildcards = {
          common: economyHistory.wcCommon,
          uncommon: economyHistory.wcUncommon,
          rare: economyHistory.wcRare,
          mythic: economyHistory.wcMythic
        };

        let missingWildcards = get_deck_missing(deck);

        let wc;
        let n = 0;
        let boosterCost = getBoosterCountEstimate(missingWildcards);
        orderedCardRarities.forEach(cardRarity => {
          if (missingWildcards[cardRarity]) {
            n++;
            wc = document.createElement("div");
            wc.classList.add("wc_explore_cost");
            wc.classList.add("wc_" + cardRarity);
            wc.title = cardRarity.capitalize() + " wldcards needed.";
            wc.innerHTML =
              (ownedWildcards[cardRarity] > 0
                ? ownedWildcards[cardRarity] + "/"
                : "") + missingWildcards[cardRarity];
            flcfwc.appendChild(wc);
          }
        });
        if (n !== 0) {
          let bo = document.createElement("div");
          bo.classList.add("bo_explore_cost");
          bo.innerHTML = Math.round(boosterCost);
          bo.title = "Boosters needed (estimated)";
          flcfwc.appendChild(bo);
        }

        var flr = document.createElement("div");
        flr.classList.add("flex_item");
        flr.style.flexDirection = "column";

        var flt = document.createElement("div");
        flt.classList.add("flex_top");

        var flb = document.createElement("div");
        flb.classList.add("flex_bottom");

        if (deck.name.indexOf("?=?Loc/Decks/Precon/") != -1) {
          deck.name = deck.name.replace("?=?Loc/Decks/Precon/", "");
        }

        d = document.createElement("div");
        d.classList.add("list_deck_name");
        d.innerHTML = deck.name;
        flt.appendChild(d);

        deck.colors.forEach(function(color) {
          var d = document.createElement("div");
          d.classList.add("mana_s20");
          d.classList.add("mana_" + mana[color]);
          flb.appendChild(d);
        });

        var wr = getDeckWinrate(deck.id, deck.lastUpdated);

        if (wr != 0) {
          var d = document.createElement("div");
          d.classList.add("list_deck_winrate");

          let colClass = getWinrateClass(wr.total);
          d.innerHTML = `${wr.wins}:${
            wr.losses
          } <span class="${colClass}_bright">(${Math.round(
            wr.total * 100
          )}%)</span>`;
          flr.appendChild(d);

          d = document.createElement("div");
          d.classList.add("list_deck_winrate");
          d.style.opacity = 0.6;

          colClass = getWinrateClass(wr.lastEdit);
          if (wr.lastEdit == 0) {
            d.innerHTML = `Since last edit: -</span>`;
          } else {
            d.innerHTML = `Since last edit: <span class="${colClass}_bright">${Math.round(
              wr.lastEdit * 100
            )}%</span>`;
          }
          flr.appendChild(d);

          wrTotalWins += wr.wins;
          wrTotalLosses += wr.losses;
          wrTotal += wr.wins + wr.losses;
        }

        if (deck.custom) {
          var fldel = document.createElement("div");
          fldel.classList.add("flex_item");
          fldel.classList.add(deck.id + "_del");
          fldel.classList.add("delete_item");
        }

        div.appendChild(fll);
        fll.appendChild(tile);
        div.appendChild(flc);
        div.appendChild(flcf);
        div.appendChild(flcfwc);
        flc.appendChild(flt);
        flc.appendChild(flb);
        div.appendChild(flr);
        if (deck.custom) {
          div.appendChild(fldel);
        }

        mainDiv.appendChild(div);

        $("." + deck.id).on("mouseenter", function() {
          $("." + deck.id + "t").css("opacity", 1);
          $("." + deck.id + "t").css("width", "200px");
        });

        $("." + deck.id).on("mouseleave", function() {
          $("." + deck.id + "t").css("opacity", 0.66);
          $("." + deck.id + "t").css("width", "128px");
        });

        $("." + deck.id).on("click", function() {
          var deck = decks[index];
          open_deck(deck, 2);
          $(".moving_ux").animate({ left: "-100%" }, 250, "easeInOutCubic");
        });

        if (deck.custom) {
          deleteDeck(deck);
        }
      }
    });

    let dtwr = $(".decks_top_winrate")[0];
    d = document.createElement("div");
    d.classList.add("list_deck_winrate");
    wrTotal = (1 / wrTotal) * wrTotalWins;
    wrTotal = wrTotal || 0;

    let colClass = getWinrateClass(wrTotal);
    d.innerHTML = `${wrTotalWins}:${wrTotalLosses} (<span class="${colClass}_bright">${Math.round(
      wrTotal * 100
    )}%</span>)`;
    dtwr.appendChild(d);

    $("#ux_0").append('<div class="list_fill"></div>');

    $(".delete_item").hover(
      function() {
        // in
        $(this).css("width", "32px");
      },
      function() {
        // out
        $(this).css("width", "4px");
      }
    );
  }
}

function filterDecks(filter) {
  filterTag = filter;
  open_decks_tab();
}

function createTag(tag, div, showClose = true) {
  let tagCol = getTagColor(tag);
  let t = createDivision(["deck_tag"], tag == null ? "Add" : tag);
  t.style.backgroundColor = tagCol;

  if (tag) {
    $(t).on("click", function(e) {
      var colorPick = $(t);
      colorPick.spectrum({
        showInitial: true,
        showAlpha: false,
        showButtons: false
      });
      colorPick.spectrum("set", tagCol);
      colorPick.spectrum("show");

      colorPick.on("move.spectrum", function(e, color) {
        let tag = $(this).text();
        let col = color.toRgbString();
        ipc_send("edit_tag", { tag: tag, color: col });
        tags_colors[tag] = col;

        $(".deck_tag").each((index, obj) => {
          let tag = $(obj).text();
          $(obj).css("background-color", tags_colors[tag]);
        });
      });

      colorPick.on("hide.spectrum", () => {
        colorPick.spectrum("destroy");
      });
      e.stopPropagation();
    });
  } else {
    $(t).on("click", function(e) {
      if ($(this).html() == "Add") {
        t.innerHTML = "";
        let input = $(
          '<input size="1" onFocus="this.select()" class="deck_tag_input"></input>'
        );
        $(t).prepend(input);

        input[0].focus();
        input[0].select();
        input.keydown(function(e) {
          setTimeout(() => {
            input.css("width", $(this).val().length * 8);
          }, 10);
          if (e.keyCode == 13) {
            let val = $(this).val();
            let deckid = jQuery.data($(this).parent()[0], "deck");

            let masterdiv = $(this)
              .parent()
              .parent()[0];
            addTag(deckid, val, masterdiv);
            $(this)
              .parent()
              .html("Add");
          }
        });
      }
      e.stopPropagation();
    });
  }

  if (showClose) {
    let tc = createDivision(["deck_tag_close"]);
    t.appendChild(tc);

    $(tc).on("click", function(e) {
      e.stopPropagation();
      let deckid = jQuery.data($(this).parent()[0], "deck");
      let val = $(this)
        .parent()
        .text();

      deleteTag(deckid, val);

      $(this).css("width", "0px");
      $(this).css("margin", "0px");
      $(this)
        .parent()
        .css("opacity", 0);
      $(this)
        .parent()
        .css("font-size", 0);
      $(this)
        .parent()
        .css("margin-right", "0px");
      $(this)
        .parent()
        .css("color", $(this).css("background-color"));
    });
  } else {
    t.style.paddingRight = "12px";
  }
  div.appendChild(t);
  return t;
}

function addTag(deckid, tag, div) {
  decks.forEach(function(deck) {
    if (deck.id === deckid && deck.format !== tag) {
      if (deck.tags) {
        if (deck.tags.indexOf(tag) == -1) {
          deck.tags.push(tag);
        }
      } else {
        deck.tags = [tag];
      }
    }
  });

  let obj = { deck: deckid, name: tag };
  ipc_send("add_tag", obj);

  createTag(tag, div);
}

function deleteTag(deckid, tag) {
  decks.forEach(function(deck) {
    if (deck.id == deckid) {
      if (deck.tags) {
        let ind = deck.tags.indexOf(tag);
        if (ind !== -1) {
          deck.tags.splice(ind, 1);
        }
      }
    }
  });

  let obj = { deck: deckid, name: tag };
  ipc_send("delete_tag", obj);
}

function getTagColor(tag) {
  let tc = tags_colors[tag];
  if (tc) return tc;

  return "#FAE5D2";
}

function deleteDeck(_deck) {
  $("." + _deck.id + "_del").on("click", function(e) {
    let currentId = _deck.id;
    e.stopPropagation();
    ipc_send("delete_deck", currentId);
    $("." + currentId).css("height", "0px");
    $("." + currentId).css("overflow", "hidden");
  });
}

module.exports = { open_decks_tab: open_decks_tab };
