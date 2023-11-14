# Fretwizard

Fretwizard is an interactive web application designed for musicians, particularly guitarists, to visualize and explore different scales and chords on a fretboard. It's a dynamic tool that allows users to select different musical keys and scale types, and see how they map onto a guitar fretboard.

## Features

- **Dynamic Fretboard Visualization:** Displays notes on the fretboard based on the selected musical key and scale type.
- **Customizable Strings:** Users can add or remove strings and set their tuning.
- **Drag-and-Drop Reordering:** Strings on the fretboard can be reordered through a drag-and-drop interface.
- **Responsive Design:** Adapts to various screen sizes for accessibility on different devices.

## How It Works

Fretwizard utilizes JavaScript to dynamically update the fretboard display. Here's a high-level summary of its functions:

- **Initialization:** On page load, the fretboard is initialized with default settings and populated with notes.
- **User Interaction:** Users can select different keys and scale types from dropdown menus, which triggers the fretboard to update.
- **Dynamic Updates:** The fretboard updates in real-time as users interact with the controls, showing the corresponding notes and scales.
- **API Integration:** Fetches chord data from an external API to display accurate chord formations.
- **Drag-and-Drop Functionality:** Allows users to rearrange the order of the strings on the fretboard.

## Getting Started

To get started with Fretwizard, clone the repository and open the `index.html` file in a web browser. Ensure that you have internet access for API calls.

## Contributing

Contributions to Fretwizard are welcome! If you have ideas for improvements or have found a bug, please open an issue or submit a pull request.
