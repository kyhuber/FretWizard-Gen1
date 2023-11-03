from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

INSTRUMENT_STRINGS = {
    'guitar': ['E', 'B', 'G', 'D', 'A', 'E'],
    'mandolin': ['E', 'A', 'D', 'G'],
    'banjo': ['D', 'B', 'G', 'D', 'G']  # Assuming a 5-string banjo
}

ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def get_notes_in_key(key):
    major_scale_intervals = [2, 2, 1, 2, 2, 2, 1]
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    start_index = notes.index(key)
    scale_notes = [notes[start_index]]
    for interval in major_scale_intervals:
        start_index = (start_index + interval) % 12
        scale_notes.append(notes[start_index])
    return scale_notes


def get_note_at_fret(string, fret):
    index = ALL_NOTES.index(string)
    return ALL_NOTES[(index + fret) % 12]


@app.route('/', methods=['GET', 'POST'])
def index():
    tuning_options = None
    if request.method == 'POST':
        # Extract form data
        instrument = request.form.get('instrument')
        
        # For now, let's just print the selected instrument to the console
        print("Instrument:", instrument)
        
        # Get the tuning options for the selected instrument
        tuning_options = INSTRUMENT_STRINGS.get(instrument, [])
        
        # TODO: Generate fretboard based on the selected instrument and tuning
        
        # TODO: Pass the fretboard data to the frontend for display

    return render_template('index.html', tuning_options=tuning_options)

@app.route('/fretboard', methods=['POST'])
def fretboard():
    tuning = request.form.getlist('tuning[]')
    selected_key = request.form.get('key', 'C')
    print("Selected Key:", selected_key)
    notes_in_key = get_notes_in_key(selected_key)   
    return render_template('fretboard.html', tuning=tuning, selected_key=selected_key, notes_in_key=notes_in_key)

if __name__ == '__main__':
    app.run(debug=True)

@app.context_processor
def utility_functions():
    return dict(get_note_at_fret=get_note_at_fret)

