let CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
let API_KEY = 'YOUR_GOOGLE_API_KEY';
let DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
let SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file";

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
        document.getElementById('settingsForm').addEventListener('submit', handleSettings);
        console.log('Google API client initialized.');
    }, function(error) {
        console.error('Error initializing Google API client: ', JSON.stringify(error, null, 2));
    });
}

function handleLogin(event) {
    event.preventDefault();
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;

    console.log('Attempting to authenticate user:', username);

    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: 'YOUR_AUTH_SPREADSHEET_ID',
        range: 'Sheet1!A2:B'
    }).then(function(response) {
        let authenticated = false;
        let values = response.result.values;
        console.log('Received authentication data:', values);
        if (values) {
            for (let row of values) {
                if (row[0] === username && row[1] === password) {
                    authenticated = true;
                    break;
                }
            }
        }
        if (authenticated) {
            console.log('User authenticated successfully.');
            showDashboard();
        } else {
            console.error('Invalid credentials.');
            alert('Invalid credentials');
        }
    }, function(error) {
        console.error('Error fetching authentication data:', JSON.stringify(error, null, 2));
    });
}

function showDashboard() {
    document.getElementById('login').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

    console.log('Fetching dashboard data...');

    // Fetch data for the dashboard
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: 'YOUR_CONFIG_SPREADSHEET_ID',
        range: 'Sheet1!A2:D'
    }).then(function(response) {
        let values = response.result.values;
        console.log('Received dashboard data:', values);
        if (values) {
            let numDevices = values.length;
            let running = values.filter(row => row[2] === 'Running').length;
            let success = values.filter(row => row[3] === 'Success').length;
            let fails = values.filter(row => row[3] === 'Fail').length;

            document.getElementById('numDevices').innerText = numDevices;
            document.getElementById('running').innerText = running;
            document.getElementById('success').innerText = success;
            document.getElementById('fails').innerText = fails;
        }
    }, function(error) {
        console.error('Error fetching dashboard data:', JSON.stringify(error, null, 2));
    });
}

function showTab(tabId) {
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById(tabId).classList.remove('hidden');
}

function handleSettings(event) {
    event.preventDefault();
    console.log('Handling settings form submission...');
    // Get form data and update Google Sheets
    // Handle file upload if a file is selected
    let fileInput = document.getElementById('fileInput');
    if (fileInput.files.length > 0) {
        let file = fileInput.files[0];
        uploadFile(file);
    }
}

function uploadFile(file) {
    console.log('Uploading file:', file.name);
    let metadata = {
        'name': file.name,
        'mimeType': file.type
    };
    let accessToken = gapi.auth.getToken().access_token;
    let form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form
    }).then((response) => response.json())
    .then((file) => {
        console.log('File uploaded: ' + file.id);
        // Update Google Sheets with the file link or relevant information
    }).catch((error) => {
        console.error('Error uploading file:', error);
    });
}

document.addEventListener('DOMContentLoaded', handleClientLoad);
