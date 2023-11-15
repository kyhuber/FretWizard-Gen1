fetch('/static_data.json')
    .then(response => response.json())
    .then(data => {
        allNotes = data.allNotes;
        scaleType = data.scaleType;
        scaleIntervals = data.scaleIntervals;
        defaultTuning = data.defaultTuning;
    });

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the fretboard when the page loads
    initializeFretboard();

    // Event listeners for key and scale type selections
    document.getElementById('keySelect').addEventListener('change', fetchAndUpdate);
    document.getElementById('scaleTypeSelect').addEventListener('change', fetchAndUpdate);

    // Event listener for the Add String button
    document.getElementById('addStringButton').addEventListener('click', addString);
});

function initializeFretboard() {
    // Fetch initial setup data and create string rows
    fetch('/fretwizard_setup')
        .then(response => response.json())
        .then(data => {
            if (data.strings && data.defaultTuning) {
                createStringRows(data.strings, data.defaultTuning);
                populateKeyDropdown(allNotes);
            }
        })
        .catch(error => console.error('Error initializing fretboard:', error));
}

function populateKeyDropdown(keys) {
    // Populate the key dropdown with notes
    const keySelect = document.getElementById('keySelect');
    keySelect.innerHTML = keys.map(key => `<option value="${key}">${key}</option>`).join('');
}

function createStringRows(numStrings, tuningNotes) {
    var tableBody = document.querySelector('.fretwizard tbody');
    tableBody.innerHTML = '';

    for (let i = 0; i < numStrings; i++) {
        let newRow = tableBody.insertRow(-1);
        newRow.draggable = true; // Make the row draggable
        newRow.addEventListener('dragstart', handleDragStart);
        newRow.addEventListener('dragover', handleDragOver);
        newRow.addEventListener('drop', handleDrop);
        newRow.addEventListener('dragend', handleDragEnd);

        let dragHandleCell = newRow.insertCell(0);
        dragHandleCell.innerHTML = '☰';
        dragHandleCell.classList.add('drag-handle');

        let cellDropdown = newRow.insertCell(1);
        cellDropdown.innerHTML = `<select class="note-input" data-string="${i + 1}">
                                    <option value="">- -</option>
                                    ${allNotes.map(note => `<option value="${note}"${tuningNotes[i] === note ? ' selected' : ''}>${note}</option>`).join('')}
                                  </select>`;

        let deleteCell = newRow.insertCell(-1); // Add at the end of the row
        deleteCell.innerHTML = '<button class="delete-btn"><i class="fas fa-trash-alt"></i></button>'; // Using Font Awesome icon
        deleteCell.querySelector('.delete-btn').addEventListener('click', function() {
            deleteStringRow(newRow);
        });

        for (let fret = 0; fret < 15; fret++) {
            let cellFret = newRow.insertCell(fret + 2);
            cellFret.classList.add('string-container');
            cellFret.setAttribute('data-note', calculateFretNote(tuningNotes[i], fret));
        }

        cellDropdown.querySelector('.note-input').addEventListener('change', function() {
            updateStringNotes(i + 1, this.value);
            fetchAndUpdate();
        });
}}

function addString() {
    // Add a new string to the fretboard
    fetch('/add_string', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                var tableBody = document.querySelector('.fretwizard tbody');
                var stringCount = tableBody.rows.length;
                var newRow = tableBody.insertRow(-1);
                newRow.draggable = true;
                newRow.addEventListener('dragstart', handleDragStart);
                newRow.addEventListener('dragover', handleDragOver);
                newRow.addEventListener('drop', handleDrop);
                newRow.addEventListener('dragend', handleDragEnd);

                let dragHandleCell = newRow.insertCell(0);
                dragHandleCell.innerHTML = '☰';
                dragHandleCell.classList.add('drag-handle');

                let cellDropdown = newRow.insertCell(1);
                cellDropdown.innerHTML = `<select class="note-input" data-string="${stringCount + 1}">
                                            <option value="">- -</option>
                                            ${allNotes.map(note => `<option value="${note}">${note}</option>`).join('')}
                                          </select>`;

                for (let i = 0; i < 15; i++) {
                    let cellFret = newRow.insertCell(i + 2);
                    cellFret.classList.add('string-container');
                    cellFret.setAttribute('data-note', '');
                }

                // Add delete button cell
                let deleteCell = newRow.insertCell(-1);
                deleteCell.innerHTML = '<button class="delete-btn"><i class="fas fa-trash-alt"></i></button>';
                deleteCell.querySelector('.delete-btn').addEventListener('click', function() {
                    newRow.remove(); // This will remove the newRow
                });                

                cellDropdown.querySelector('.note-input').addEventListener('change', function() {
                    updateStringNotes(stringCount + 1, this.value);
                    fetchAndUpdate();
                });
            }
        })
        .catch(error => console.error('Error adding string:', error));
}

function deleteStringRow(row) {
    // Optional: Add logic to confirm deletion
    if (confirm('Are you sure you really want to snap this string?')) {
        row.remove(); // Remove the row from the table
        // Optional: Send a request to the server to update the state
    }
}


function updateStringNotes(stringNumber, selectedNote) {
    console.log(`Updating string notes for string number: ${stringNumber}, selected note: ${selectedNote}`);
    var frets = document.querySelectorAll('.fretwizard tr:nth-child(' + stringNumber + ') .string-container');
    frets.forEach(function(fret, fretIndex) {
        var note = calculateFretNote(selectedNote, fretIndex);
        fret.setAttribute('data-note', note);
    });
    fetchAndUpdate(); // Call this to refresh the highlighted notes
}

function fetchAndUpdate() {
    console.log('Fetching and updating scale notes...');
    var key = document.getElementById('keySelect').value;
    var scaleType = document.getElementById('scaleTypeSelect').value; // Get the selected scale type
    console.log(`Selected key: ${key}, scale type: ${scaleType}`);
    if (key) {
        fetch('/get_scale_notes?key=' + key + '&scaleType=' + scaleType)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                console.log('Data received from get_scale_notes:', data);
                if (data.success) {
                    updateFretwizard(data.notes);
                    highlightRootNotes();
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
    console.log(`Calculating fret note for string note: ${stringNote}, fret index: ${fretIndex}`);
    const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let noteIndex = chromaticScale.indexOf(stringNote);
    let fretNoteIndex = (noteIndex + fretIndex) % chromaticScale.length;
    let calculatedNote = chromaticScale[fretNoteIndex];
    console.log(`Calculated note: ${calculatedNote}`);
    return calculatedNote;
}

function updateFretwizard(scaleNotes) {
    console.log('Updating fretwizard with scale notes:', scaleNotes);
    var stringContainers = document.querySelectorAll('.string-container');
    stringContainers.forEach(function(container) {
        var note = container.getAttribute('data-note');
        console.log(`Updating note: ${note} in fretwizard`);
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
    console.log('Highlighting root notes...');
    var selectedKey = document.getElementById('keySelect').value;
    console.log(`Selected key for highlighting: ${selectedKey}`);
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

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.fretwizard tbody tr').forEach(row => {
        row.addEventListener('dragstart', handleDragStart);
        row.addEventListener('dragover', handleDragOver);
        row.addEventListener('drop', handleDrop);
        row.addEventListener('dragend', handleDragEnd);
    });
});

function handleDragStart(e) {
    draggedRow = e.target;
    console.log('Drag started on:', e.target);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.id);
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    console.log('Dragging over:', e.target);
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    console.log('Dropped on:', e.target);
    if (draggedRow) {
        let targetRow = e.target.closest('tr');
        if (targetRow && targetRow.parentNode) {
            // Determine whether to insert before or after based on mouse position
            const rect = targetRow.getBoundingClientRect();
            const offset = e.clientY - rect.top - (rect.height / 2);
            if (offset > 0) {
                targetRow.parentNode.insertBefore(draggedRow, targetRow.nextSibling);
            } else {
                targetRow.parentNode.insertBefore(draggedRow, targetRow);
            }
            // Optionally, update the server about the change
        }
    }
}

function handleDragEnd(e) {
    console.log('Drag ended');
    e.target.classList.remove('dragging');
}