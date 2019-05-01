const electron = require("electron");
const ipc = electron.ipcRenderer;

//
ipc.on("update_progress", (event, state) => {
  console.log(state);

  let progress = state.percent;
  let speed = Math.round(state.bytesPerSecond / 1024);
  let progressBar = document.getElementById("progressBar");
  progressBar.style.width = Math.round(progress) + "%";

  state.total = Math.round((state.total / 1024 / 1024) * 100) / 100;
  state.transferred = Math.round((state.transferred / 1024 / 1024) * 100) / 100;

  document.getElementById("progressText").innerHTML = ` ${
    state.transferred
  }mb / ${state.total}mb (${speed}kb/s)`;
});

/*
state (download-progress)
	progress ProgressInfo
	bytesPerSecond
	percent
	total
	transferred
*/
