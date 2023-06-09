import '../socket.io/socket.io.js'

const baseURL = document.querySelector('base').getAttribute('href')

// Create a Handlebars template from the template-tag (rendered from index.hbs)
//const hbsTemplate = window.Handlebars.compile(issueTemplate.innerHTML)

// Create a socket connection using Socket.io
const socket = window.io({path: `${baseURL}socket.io`})

// Listen for message "new issue" from the server
socket.on('new-issue', arg => {
    // Use the template to create a new Issue element
    const issueString = hbsTemplate(arg)
    const div = document.createElement('div')
    div.classList.add('issue')
    div.id = 'issueid_' + arg.issueid
    div.innerHTML = issueString

    // Append the new element to the Issue list
    const issueList = document.querySelector('#issue-list')
    issueList.appendChild(div)
})

// Listen for message "update issue" from the server
socket.on('update', arg => {
    const tempText = document.querySelector('#currentTemperature')
    const humText = document.querySelector('#currentHumidity')
    tempText.textContent = '🌡 ' + arg.temperature + '°C';
    humText.textContent = '💧 ' + arg.humidity +'%';
    window.updateReadingsCharts(arg.lastReadings, arg.meanReadings)
})
