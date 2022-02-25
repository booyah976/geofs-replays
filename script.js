// ==UserScript==
// @name         GeoFS Replays
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Save and view replays of flights on the GeoFS flight simulator
// @author       booyah976
// @match        https://www.geo-fs.com/geofs.php
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.listValues
// @grant        GM.deleteValue
// @require      https://code.jquery.com/jquery-3.6.0.slim.js

// ==/UserScript==



// Initialise options variables


// Create UI REPLAY button
var replay_button = document.createElement("button");
replay_button.style = "color: white; background:blue";
replay_button.innerText = "REPLAY";
replay_button.classList.add("mdl-button");
replay_button.classList.add("mdl-js-button");
replay_button.classList.add("geofs-f-standard-ui");
replay_button.id = "replay-options";

var bottom_ui = document.getElementsByClassName("geofs-ui-bottom")[0];
bottom_ui.appendChild(replay_button);

// Create options sidebar (why am i doing this alone in jquery)
$("body").append(`
<div id="right-sidebar" class="hidden">
    <h5 style="margin-left:10px, margin-right:10px">Replay Options</h5>
    <input id="index-box"></input>
    <ul style="list-style-type: none; padding: 0; margin: 0;;">
            <button id="save-replay" class="">SAVE</button>
            <button id="load-replay" class="">LOAD</button>
            <button id="delete-replay">DELETE</button>
    </ul>
    <br>

    <div>Stored index values:
    <div id="show-gm-values" style="border-style:solid; border-color:blue;">{}</div>
    </div>

    <div>
    <br>

    <input type="checkbox" id="autosave-cbox" name="autosave-cbox">
    <label for="autosave-cbox">Enable Autosave</label>
    <br>
    <button id="combine-button">COMBINE SLOTS</button>
    <br>
    <textarea id="tape-dump-area">Tapes will be dumped here</textarea>
    <br>
    <button id="load-dump">LOAD FROM DUMP</button>
    </div>
    <br>
    <span id="log-messages"></span>
</div>
`)

var autosave_slots = []

setInterval(function () {
    if (document.getElementById("autosave-cbox").checked && !(flight.recorder.playing) && flight.recorder.tape.length > 995) {
        autosave_slots.push([]);
        autosave_slots[autosave_slots.length - 1].push(Object.values(flight.recorder.tape))
        flight.recorder.tape = [];
        console.log("Autosaved", autosave_slots[autosave_slots.length - 1]);
        logMessage("Autosaved to a slot", "green");
    };
}, 5000);



async function load_replay_keys() {
    document.getElementById("show-gm-values").innerText = await GM.listValues()
};
load_replay_keys();

// TODO: Find out whats wrong with this
// document.getElementById("index-box").on("keypress keydown keyup", function(e) {
//     e.stopPropagation();
// });


// Show and hide right sidebar
replay_button = document.getElementById("replay-options");
replay_button.addEventListener("click", function () {
    let rightSidebar = document.getElementById("right-sidebar")
    rightSidebar.classList.toggle("hidden")
});


// Saves replay to a LevelDB database
var saveReplay = document.getElementById("save-replay");
saveReplay.addEventListener("click", async function () {
    let index = document.getElementById("index-box").value;
    if (!(index === "")) {
        console.log("Saved with index", index);
        await GM.setValue(index, Object.values(flight.recorder.tape));
        console.log(await GM.listValues())
        logMessage("Saved replay", "green");
    }
    load_replay_keys();

});

// Get tape data from DB
var loadReplay = document.getElementById("load-replay");
loadReplay.addEventListener("click", async function () {
    let index = document.getElementById("index-box").value;
    if (!(index === "")) {
        // Pause before setting flight.recorder.tape
        if (!(geofs.pause)) {
            geofs.togglePause();
        }
        let tape = await GM.getValue(index);
        flight.recorder.tape = tape;
        flight.recorder.enterPlayback();
        console.log("Loading index, Tape:", tape)
        dumpText(tape);
        logMessage("Loaded replay", "green");
    }
});


// Delete entry from DB
var deleteReplay = document.getElementById("delete-replay");
deleteReplay.addEventListener("click", async function () {
    let index = document.getElementById("index-box").value;
    if (!(index === "")) {
        await GM.deleteValue(index);
        console.log("Deleted", index);
        logMessage("Deleted replay", "red");
    }
    load_replay_keys();
})


// Combines all the tapes in each autosave slots to one big array
var combineButton = document.getElementById("combine-button");
combineButton.addEventListener("click", function () {
    let final = [];
    console.log(autosave_slots.length)

    if (autosave_slots.length > 0) {
        for (let i = 0; i <= autosave_slots.length; i += 1) {
            autosave_slots[i].forEach(function (item, index) {
                final.push(item);
            });
        };
        console.log(final);
        dumpText(final);
    }
})

function dumpText(to_dump) {
    document.getElementById("tape-dump-area").value = JSON.stringify(to_dump);
    console.log(JSON.stringify(to_dump));
};

document.getElementById("load-dump").addEventListener("click", function () {
    if (!(geofs.pause)) {
        geofs.togglePause();
    }
    let tape = document.getElementById("tape-dump-area").value;
    flight.recorder.tape = JSON.parse(tape);
    flight.recorder.enterPlayback();
});

function logMessage(text, color) {
    document.getElementById("log-messages").innerText = ">>" + String(text);
    document.getElementById("log-messages").style = "color:" + String(color);
}
