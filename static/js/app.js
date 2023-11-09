// Define ALL_NOTES at the top of your script so it's available when needed
const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the fretboard when the page loads
    initializeFretboard();

    // Event listener for the key selection
    document.getElementById('keySelect').addEventListener('change', fetchAndUpdate);

    // Event listener for the scale type selection
    document.getElementById('scaleTypeSelect').addEventListener('change', fetchAndUpdate);

    // Event listener for the Add String button
    document.getElementById('addStringButton').addEventListener('click', addString);
});

function initializeFretboard() {
    fetch('/fretwizard_setup')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }
            let contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return response.text().then(text => {
                    throw new Error(`Expected JSON response but received: ${contentType}, body: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.strings && data.default_tuning) {
                createStringRows(data.strings, data.default_tuning);
                populateKeyDropdown(ALL_NOTES);
            }
        })
        .catch(error => console.error('Error initializing fretboard:', error));
}

function populateKeyDropdown(keys) {
    const keySelect = document.getElementById('keySelect');
    keySelect.innerHTML = ''; // Clear existing options
    keys.forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        keySelect.appendChild(option);
    });
}

function createStringRows(numStrings, tuningNotes) {
    var tableBody = document.querySelector('.fretwizard tbody');
    // Clear existing rows
    tableBody.innerHTML = '';

    for (let i = 0; i < numStrings; i++) {
        let newRow = tableBody.insertRow(-1); // Insert at the end of the table
        let cellDropdown = newRow.insertCell(0);
        let selectHTML = `<select class="note-input" data-string="${i + 1}">
                            <option value="">Select Note</option>`;

        ALL_NOTES.forEach(note => {
            selectHTML += `<option value="${note}"${tuningNotes[i] === note ? ' selected' : ''}>${note}</option>`;
        });

        selectHTML += `</select>`;
        cellDropdown.innerHTML = selectHTML;

        // Create the fret cells
        for (let fret = 0; fret < 15; fret++) {
            let cellFret = newRow.insertCell(fret + 1);
            cellFret.classList.add('string-container');
            let noteAtFret = calculateFretNote(tuningNotes[i], fret);
            cellFret.setAttribute('data-note', noteAtFret);
        }

        // Add event listener to the new dropdown
        cellDropdown.querySelector('.note-input').addEventListener('change', function() {
            var selectedNote = this.value;
            updateStringNotes(i + 1, selectedNote); // +1 because string numbers are 1-indexed
            fetchAndUpdate(); // Refresh the table with the new tuning
        });
    }
}

function addString() {
    // Send a POST request to the server to add a new string
    fetch('/add_string', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
        // No need to send a body, as the server will just append a default note
    }).then(response => response.json())
    .then(data => {
        if (data.success) {
            // Get the table body where the strings are listed
            var tableBody = document.querySelector('.fretwizard tbody');
            var stringCount = document.querySelectorAll('.note-input').length;
            var newRow = tableBody.insertRow(-1); // Insert at the end of the table

            // Create the dropdown cell
            var cellDropdown = newRow.insertCell(0);
            var selectHTML = `<select class="note-input" data-string="${stringCount + 1}">
                                <option value="">Select Note</option>`;
            ALL_NOTES.forEach(function(note) {
                selectHTML += `<option value="${note}">${note}</option>`;
            });
            selectHTML += `</select>`;
            cellDropdown.innerHTML = selectHTML;

            // Create the fret cells
            for (var i = 0; i < 15; i++) {
                var cellFret = newRow.insertCell(i + 1);
                cellFret.classList.add('string-container');
                cellFret.setAttribute('data-note', ''); // Default blank value
            }

            // Add event listener to the new dropdown
            cellDropdown.querySelector('.note-input').addEventListener('change', function() {
                var selectedNote = this.value;
                updateStringNotes(stringCount + 1, selectedNote); // +1 to account for the array starting at 0
                fetchAndUpdate(); // Refresh the table with the new tuning
            });
        }
    }).catch(error => {
        console.error('Error adding string:', error);
    });
}

function updateStringNotes(stringNumber, selectedNote) {
    // Use the stringNumber directly since it's already adjusted for the header row
    var frets = document.querySelectorAll('.fretwizard tr:nth-child(' + stringNumber + ') .string-container');
    frets.forEach(function(fret, fretIndex) {
        var note = calculateFretNote(selectedNote, fretIndex);
        fret.setAttribute('data-note', note);
    });
    fetchAndUpdate(); // Call this to refresh the highlighted notes
}

function fetchAndUpdate() {
    var key = document.getElementById('keySelect').value;
    var scaleType = document.getElementById('scaleTypeSelect').value; // Get the selected scale type
    if (key) {
        fetch('/get_scale_notes?key=' + key + '&scaleType=' + scaleType)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data.success) {
                    updateFretwizard(data.notes);
                    highlightRootNotes()
                } else {
                    console.error('Error:', data.message);
                }
            })
            .catch(function(error) {
                console.error('Fetch error:', error);
            });
    } else {
        clearFretwizard();
    }
}

function calculateFretNote(stringNote, fretIndex) {
    const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let noteIndex = chromaticScale.indexOf(stringNote);
    let fretNoteIndex = (noteIndex + fretIndex) % chromaticScale.length;
    return chromaticScale[fretNoteIndex];
}

function updateFretwizard(scaleNotes) {
    var stringContainers = document.querySelectorAll('.string-container');
    stringContainers.forEach(function(container) {
        var note = container.getAttribute('data-note');
        container.innerHTML = ''; // Clear previous notes
        if (scaleNotes.includes(note)) {
            var noteCircle = document.createElement('div');
            noteCircle.classList.add('note-circle');
            noteCircle.textContent = note;
            container.appendChild(noteCircle);
        }
    });
    // After updating the fretwizard, highlight the root notes
    highlightRootNotes();
}

function highlightRootNotes() {
    var selectedKey = document.getElementById('keySelect').value;
    var noteCircles = document.querySelectorAll('.note-circle');
  
    noteCircles.forEach(function(circle) {
        if (circle.textContent === selectedKey) {
            circle.classList.add('root-note');
        } else {
            circle.classList.remove('root-note');
        }
    });
}

function clearFretwizard() {
    var stringContainers = document.querySelectorAll('.string-container');
    stringContainers.forEach(function(container) {
        container.innerHTML = ''; // Clear the fretwizard
    });
}