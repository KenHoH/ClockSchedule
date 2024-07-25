/* exported gapiLoaded */
/* exported gisLoaded */
/* exported handleAuthClick */
/* exported handleSignoutClick */

// TODO: date informations
// show current date
let date = new Date();
const year = date.getFullYear();
const month = date.getMonth();
const day = date.getDate();

// format date
let monthArray = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
let formattedMonth = monthArray[month];
let formattedDay = String(day).padStart(2, "0");

// show current time
let hours = date.getHours();
let minutes = date.getMinutes();
let seconds = date.getSeconds();

// Format the time with leading zeros
let formattedHours = hours;
let formattedMinutes = String(minutes).padStart(2, "0");
let formattedSeconds = String(seconds).padStart(2, "0");

// content id
const content = document.getElementById("content");

// create HTML element
function create(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

// TODO(developer): Set to client ID and API key from the Developer Console
const CLIENT_ID = "";
const API_KEY = "";

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById("authorize_button").style.visibility = "hidden";
document.getElementById("signout_button").style.display = "none";

// Callback after api.js is loaded.
function gapiLoaded() {
  gapi.load("client", initializeGapiClient);
}

// Callback after the API client is loaded. Loads the discovery doc to initialize the API.
async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
}

// Callback after Google Identity Services are loaded.
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: "", // defined later
  });
  gisInited = true;
  maybeEnableButtons();
}

// Enables user interaction after all libraries are loaded.
function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById("authorize_button").style.visibility = "visible";
  }
}

// Sign in the user upon button click.
function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw resp;
    }
    document.getElementById("signout_button").style.display = "block";
    document.getElementById("authorize_button").innerText = "Refresh";
    await listUpcomingEvents();
  };

  if (gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({ prompt: "consent" });
  } else {
    // Skip display of account chooser and consent dialog for an existing session.
    tokenClient.requestAccessToken({ prompt: "" });
  }
}

// Sign out the user upon button click.
function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken("");
    document.getElementById("content").innerText = "";
    document.getElementById("authorize_button").innerText = "Authorize";
    document.getElementById("signout_button").style.visibility = "hidden";
  }
}

/*
Print the summary and start datetime/date of the next ten events in
the authorized user's calendar. If no events are found an
appropriate message is printed.
*/

// TODO: editing section
let todayArray = [];
let dateDataArray = []; //only date events no time stamp
let timeDataArray = []; //only date with time stamp
async function listUpcomingEvents() {
  let response;
  try {
    const request = {
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 10,
      orderBy: "startTime",
    };
    console.log("list up coming events");
    response = await gapi.client.calendar.events.list(request);
  } catch (err) {
    document.getElementById("content").innerText = err.message;
    return;
  }
  const events = response.result.items;
  if (!events || events.length == 0) {
    document.getElementById("content").innerText = "No events found.";
    return;
  }

  // looping through events array
  for (let index = 0; index < events.length; index++) {
    // events[index].summary = event title
    // events[index].start.dateTime = start date and time
    // events[index].start.date = date of the event, no need end date
    // events[index].end.dateTime = end date and time
    let data = {
      summary: events[index].summary,
      date: "",
      start: "",
      end: "",
    };
    if (events[index].start.dateTime === undefined) {
      data.date = events[index].start.date.slice(0, 10);
      dateDataArray.push(data);
    } else {
      let dataStartTime = events[index].start.dateTime.slice(11, 19);
      let dataEndTime = events[index].end.dateTime.slice(11, 19);
      data.date = events[index].start.dateTime.slice(0, 10);
      data.start = dataStartTime;
      data.end = dataEndTime;
      timeDataArray.push(data);
    }
  }
  // showing the data
  showData();
  checkSchedule(todayArray);
  let minuteCounter = 0;
  setInterval(() => {
    minuteCounter++;
    console.log("minuteCounter : " + minuteCounter);
    checkSchedule(todayArray);
  }, 60000);
}

function showData() {
  console.log("data that only have date\n");
  console.log(dateDataArray);
  console.log("data that only have time\n");
  console.log(timeDataArray);
  console.log("today's data\n");
  console.log(todayArray);

  let listElement;
  let today =
    year + "-" + String(month + 1).padStart(2, "0") + "-" + formattedDay;
  console.log("today: " + today);
  // get content id is on the top
  // show the date events only
  let todayData = {
    id: "none",
    summary: "",
    start: "none",
    end: "none",
  };
  dateDataArray.forEach((e) => {
    if (e.date == today) {
      todayData = {
        id: "date",
        summary: e.summary,
        start: "00:00:00",
        end: "00:00:00",
      };
      todayArray.push(todayData);
    }
    listElement = create(`
      <li class="list-card">
      <p>${e.date}<p>
      <p>Event: ${e.summary}<p>
      </li>
      `);
    content.appendChild(listElement);
  });
  timeDataArray.forEach((e) => {
    if (e.date == today) {
      todayData = {
        id: "time",
        summary: e.summary,
        start: e.start,
        end: e.end,
      };
      todayArray.push(todayData);
    }
    listElement = create(`
      <li class="list-card">
      <p>${e.date}</p>
      <p>Event: ${e.summary}</p>
      <p>Time: ${e.start.slice(0, 5)}-${e.end.slice(0, 5)}</p>
      </li>
      `);
    content.appendChild(listElement);
  });
}

// Clock work function
clockRender();

// getting the id
const clock = document.getElementById("clock");
const dateId = document.getElementById("date");

// Update the date and time HTML element
dateId.textContent = `${day > 10 ? day : "0" + day} ${formattedMonth} ${year}`;
clock.textContent = `-${formattedHours}:${formattedMinutes}:${formattedSeconds}-`;
function clockRender() {
  // Function to update the clock every second
  setInterval(updateClock, 1000);
  function updateClock() {
    date = new Date();
    hours = date.getHours();
    minutes = date.getMinutes();
    seconds = date.getSeconds();

    // Format the time with leading zeros
    formattedHours = String(hours).padStart(2, "0");
    formattedMinutes = String(minutes).padStart(2, "0");
    formattedSeconds = String(seconds).padStart(2, "0");

    // Update the clock HTML
    clock.textContent = `-${formattedHours}:${formattedMinutes}:${formattedSeconds}-`;
  }
}

const nowId = document.getElementById("currentTime");
const nextId = document.getElementById("nextHourTime");
function checkSchedule(array) {
  console.log("checking");
  console.log(array);
  //iterate through todayArray
  array.forEach((e) => {
    // raw data
    let nowTime = `${hours}${formattedMinutes}`;
    let startTime = e.start.replace(":", "");
    let endTime = e.end.replace(":", "");

    // formatted number data
    let nowTimeNumber = parseInt(nowTime);
    let startTimeNumber = parseInt(startTime);
    let endTimeNumber = parseInt(endTime);

    let forwardTime = nowTimeNumber + 100;

    // testing area
    console.log(nowTimeNumber + " " + startTimeNumber + " " + endTimeNumber);
    console.log("forward time " + forwardTime);
    // current time schedule deadline
    if (
      e.id == "time" &&
      nowTimeNumber <= endTimeNumber &&
      nowTimeNumber >= startTimeNumber
    ) {
      // for current time schedule textContent
      listElement = create(`
        <li class="list-card">
        <p>${e.summary}<p>
        <p>${e.start.slice(0, 5)}-${e.end.slice(0, 5)}</p>
        </li>
        `);
      nowId.appendChild(listElement);
    }
    // in 1 hours schedule deadline
    else if (
      e.id == "time" &&
      forwardTime <= endTimeNumber &&
      forwardTime >= startTimeNumber
    ) {
      // for the next hour time schedule deadline
      listElement = create(`
        <li class="list-card">
        <p>${e.summary}<p>
        <p>${e.start.slice(0, 5)}-${e.end.slice(0, 5)}</p>
        </li>
        `);
      nextId.appendChild(listElement);
    }
  });
}
