import json, os

# Construct the absolute path to the JSON file
base_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(base_dir, 'static', 'static_data.json')

def test_read_json(json_path):
    try:
        with open(json_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            print("JSON data successfully read:")
            print(data)
    except json.decoder.JSONDecodeError as e:
        print(f"JSON Decode Error: {e}")
    except FileNotFoundError:
        print("File not found.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    json_file_path = 'C:\\Users\\Kai\\Desktop\\Projects\\FretWizard\\static\\static_data.json'
    test_read_json(json_file_path)
