from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify

app = Flask(__name__)
app.secret_key = 'your_secret_key'

# Constants
INSTRUMENT_STRINGS = {
    'guitar': ['E', 'B', 'G', 'D', 'A', 'E'],
    'bass': ['G', 'D', 'A', 'E'],
    'mandolin': ['E', 'A', 'D', 'G'],
    'banjo': ['D', 'B', 'G', 'D', 'G'],
}
ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
major_scale_intervals = [2, 2, 1, 2, 2, 2, 1]
minor_scale_intervals = [2, 1, 2, 2, 1, 2, 2]

SCALE_INTERVALS = {
    "major": major_scale_intervals,
    "minor": minor_scale_intervals,
}

INSTRUMENT_IMAGES = {
    'guitar': 'lespaul.jpg',
    'bass': 'jazzbass.jpg',
    'mandolin': 'mandolin.jpg',
    'banjo': 'banjo.jpg',
}

def get_notes_in_key(key, scale_type):
    scale_intervals = SCALE_INTERVALS.get(scale_type, None)
    if scale_intervals is None:
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

def invert_tuning(tuning):
    return tuning[::-1]

@app.context_processor
def utility_functions():
    return dict(get_note_at_fret=get_note_at_fret)

@app.route('/')
def index():
    return redirect(url_for('fretwizard'))

@app.route('/fretwizard', methods=['GET', 'POST'])
def fretwizard():
    # Get the instrument and tuning from the session
    instrument = session.get('instrument', 'Guitar')
    tuning = session.get('tuning', [])
    
    # Get the selected key and scale type from the request, if they exist
    selected_key = request.form.get('key')
    scale_type = request.form.get('scale_type')

    # If the selected key and scale type exist, get the notes in the key
    notes_in_key = []
    if selected_key and scale_type:
        notes_in_key = get_notes_in_key(selected_key, scale_type)

    # Get the image for the instrument
    instrument_image = INSTRUMENT_IMAGES.get(instrument.lower(), 'static/images/fretboard_photo.jpg')

    # Render the fretwizard form
    return render_template('fretwizard.html',
                           tuning=tuning,
                           inverted_tuning=invert_tuning(tuning),
                           instrument=session.get('instrument', 'Guitar'),
                           selected_key=selected_key,
                           notes_in_key=notes_in_key,
                           instrument_image=instrument_image)

@app.route('/fretwizard_setup', methods=['GET'])
def fretwizard_setup():
    strings = 4  # Number of strings
    default_tuning = ['G', 'D', 'A', 'E']  # Default tuning for a 4-string bass
    # Pass the ALL_NOTES constant and default tuning to the template
    return jsonify(
        all_notes=ALL_NOTES,
        strings=strings,
        default_tuning=default_tuning)

@app.route('/get_scale_notes')
def get_scale_notes():
    key = request.args.get('key')
    if not key:
        return jsonify(success=False, message="Key is required."), 400
    scale_type = request.args.get('scaleType', 'major')  # Default to 'major' if not provided
    scale_notes = calculate_scale_notes(key, scale_type)
    return jsonify(success=True, notes=scale_notes)


def calculate_scale_notes(key, scale_type):

    # Find the starting index of the key in the chromatic scale
    start_index = ALL_NOTES.index(key)

    # Define steps for major and minor scales
    steps = {
        'major': ['W', 'W', 'H', 'W', 'W', 'W', 'H'],
        'minor': ['W', 'H', 'W', 'W', 'H', 'W', 'W']
    }

    # Calculate the scale notes based on the steps for the given scale type
    scale_notes = [key]  # Start with the tonic note
    for step in steps[scale_type]:
        if step == 'W':
            start_index = (start_index + 2) % 12  # Move a whole step
        elif step == 'H':
            start_index = (start_index + 1) % 12  # Move a half step
        scale_notes.append(ALL_NOTES[start_index])

    return scale_notes


@app.route('/add_string', methods=['POST'])
def add_string():
    # Check if 'tuning' is already in session, if not, create it
    if 'tuning' not in session:
        session['tuning'] = ['E', 'A', 'D', 'G']

    # Append a new string with a default note (e.g., 'E')
    session['tuning'].append('E')  # You can choose a different default note if you wish

    # Save the changes to the session
    session.modified = True

    # Return a success response with the updated tuning
    return jsonify(success=True, tuning=session['tuning'])

if __name__ == '__main__':
    app.run(debug=False)