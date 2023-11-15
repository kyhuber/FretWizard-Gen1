from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import os
import json

app = Flask(__name__)
app.secret_key = 'firsteversecretkey'

# Declare global variables
allNotes = None
scaleType = None
scaleIntervals = None
chordTypes = None
defaultTuning = None

def load_config():
    global allNotes, scaleIntervals, chordTypes, defaultTuning
    # Construct the absolute path to the JSON file
    json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'static_data.json')
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        # Set the global variables
        allNotes = data['allNotes']
        scaleType = data['scaleType']
        scaleIntervals = data['scaleIntervals']
        chordTypes = data['chordTypes']
        defaultTuning = data['defaultTuning']
    except (FileNotFoundError, json.decoder.JSONDecodeError, Exception) as e:
        print(f"An error occurred loading the configuration: {e}")

# Construct the absolute path to the JSON file
base_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(base_dir, 'static', 'static_data.json')

try:
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    allNotes = data['allNotes']
    scaleType = data['scaleType']
    scaleIntervals = data['scaleIntervals']
    chordTypes = data['chordTypes']
    defaultTuning = data['defaultTuning']

except json.decoder.JSONDecodeError as e:
    print(f"JSON Decode Error: {e}")
    # Additional error handling
except FileNotFoundError:
    print(f"File not found at path: {json_path}")
    # Additional error handling
except Exception as e:
    print(f"An error occurred: {e}")
    # Additional error handling

def get_notes_in_key(key, scale_type):
    scale_intervals = scaleIntervals.get(scale_type, None)
    if scale_intervals is None:
        raise ValueError("Invalid scale type. Choose 'Major' or 'Minor'.")
    
    start_index = allNotes.index(key)
    scale_notes = [allNotes[start_index]]
    for interval in scale_intervals:
        start_index = (start_index + interval) % 12
        scale_notes.append(allNotes[start_index])
    return scale_notes

def get_note_at_fret(string, fret):
    index = allNotes.index(string)
    return allNotes[(index + fret) % 12]

def invert_tuning(tuning):
    return tuning[::-1]

@app.context_processor
def utility_functions():
    return dict(get_note_at_fret=get_note_at_fret)

@app.route('/')
def index():
    return redirect(url_for('fwSV'))

@app.route('/fwSV', methods=['GET', 'POST'])
def fwSV():
    tuning = session.get('tuning', defaultTuning)
    selected_key = request.form.get('key')
    scale_type = request.form.get('scaleType')
    notes_in_key = []
    if selected_key and scale_type:
        notes_in_key = get_notes_in_key(selected_key, scale_type)
    return render_template('fwSV.html', tuning=tuning, selected_key=selected_key, notes_in_key=notes_in_key)

# @app.route('/fwCV', methods=['GET', 'POST'])
# def fwCV():
#     tuning = session.get('tuning', defaultTuning)
#     selected_key = request.form.get('key')
#     scale_type = request.form.get('scaleType')
#     notes_in_key = []
#     if selected_key and scale_type:
#         notes_in_key = get_notes_in_key(selected_key, scale_type)
#     return render_template('fwCV.html', tuning=tuning, selected_key=selected_key, notes_in_key=notes_in_key)

@app.route('/fretwizard_setup', methods=['GET'])
def fretwizard_setup():
    strings = 6  # Number of strings
    return jsonify(allNotes=allNotes, strings=strings, defaultTuning=defaultTuning)

def calculate_scale_notes(key, scale_type):
    start_index = allNotes.index(key)
    steps = scaleIntervals.get(scale_type)
    if steps is None:
        raise ValueError("Invalid scale type. Choose 'Major' or 'Minor'.")

    scale_notes = [key]
    for step in steps:
        if step == 2:
            start_index = (start_index + 2) % 12  # Move a whole step
        elif step == 1:
            start_index = (start_index + 1) % 12  # Move a half step
        scale_notes.append(allNotes[start_index])
    return scale_notes


@app.route('/get_scale_notes')
def get_scale_notes():
    key = request.args.get('key')
    scale_type = request.args.get('scaleType', 'Major')  # Provide a default if not specified
    if not key or not scale_type:
        return jsonify(success=False, message="Key and scale type are required."), 400

    try:
        scale_notes = calculate_scale_notes(key, scale_type)
        return jsonify(success=True, notes=scale_notes)
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

@app.route('/add_string', methods=['POST'])
def add_string():
    # Check if 'tuning' is already in session, if not, create it
    if 'tuning' not in session:
        session['tuning'] = ['E', 'A', 'D', 'G', 'B', 'E']

    # Append a new string with a default note (e.g., 'E')
    session['tuning'].append('E')  # You can choose a different default note if you wish

    # Save the changes to the session
    session.modified = True

    # Return a success response with the updated tuning
    return jsonify(success=True, tuning=session['tuning'])

if __name__ == '__main__':
    app.run(debug=True)