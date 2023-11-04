from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# Constants
INSTRUMENT_STRINGS = {
    'guitar': ['E', 'B', 'G', 'D', 'A', 'E'],
    'bass' : ['G', 'D', 'A', 'E'],
    'mandolin': ['E', 'A', 'D', 'G'],
    'banjo': ['D', 'B', 'G', 'D', 'G'],  # Assuming a 5-string banjo
}
ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

major_scale_intervals = [2, 2, 1, 2, 2, 2, 1]
minor_scale_intervals = [2, 1, 2, 2, 1, 2, 2]

def get_notes_in_key(key, scale_type):
    # Choose the scale intervals based on the scale type
    if scale_type == "major":
        scale_intervals = major_scale_intervals
    elif scale_type == "minor":
        scale_intervals = minor_scale_intervals
    else:
        raise ValueError("Invalid scale type. Choose 'major' or 'minor'.")
    
    start_index = ALL_NOTES.index(key)
    scale_notes = [ALL_NOTES[start_index]]
    for interval in scale_intervals:
        start_index = (start_index + interval) % 12
        scale_notes.append(ALL_NOTES[start_index])
    return scale_notes

def get_note_at_fret(string, fret):
    index = ALL_NOTES.index(string)
    return ALL_NOTES[(index + fret) % 12]

@app.context_processor
def utility_functions():
    return dict(get_note_at_fret=get_note_at_fret)

# Routes
@app.route('/', methods=['GET', 'POST'])
def index():
    instrument = request.form.get('instrument', 'guitar')  # Default to 'guitar'
    if request.method == 'POST':
        tuning_options = INSTRUMENT_STRINGS.get(instrument, [])
    else:
        tuning_options = []
    return render_template('index.html', instrument=instrument, tuning_options=tuning_options)

@app.route('/fretboard', methods=['POST'])
def fretboard():
    tuning = request.form.getlist('tuning[]')
    instrument = request.form.get('instrument', 'guitar').capitalize()  # Default to 'guitar'
    selected_key = request.form.get('key', 'C')
    scale_type = request.form.get('scale_type', 'major')  # Default to 'major'
    notes_in_key = get_notes_in_key(selected_key, scale_type)   
    return render_template('fretboard.html', tuning=tuning, instrument=instrument, selected_key=selected_key, notes_in_key=notes_in_key)

app.debug = True

if __name__ == '__main__':
    app.run(debug=True)