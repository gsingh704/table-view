# table-view README


**Table View** enhances your debugging experience in VS Code by allowing you to inspect 2D arrays and objects in a rich, interactive table and chart interface. 

### 📊 Interactive Data Table
Click on View as Table icon to open a complex variable (Array or Object) in the Debug Variables panel.. The extension extracts the data and presents it in a dedicated webview panel containing:

- **Sorting & Filtering**: Sort columns ascending/descending and filter data on the fly.
- **Pagination**: Handle large arrays easily with built-in pagination.
- **Column Visibility**: Toggle specific columns on or off, or use "Select All" for quick resets.
- **Resizable Columns**: Drag column headers to adjust their width.
- **Inline Editing**: Double-click any cell to edit its value directly. Changes are pushed back to the active debug session!
- **Data Manipulation**: Select and delete rows, insert empty rows at specific indexes, or append new rows to the current array/object.
- **Export Data**: Export the current table view to **CSV** or **JSON** for external analysis.
- **Instant Chart View**: Toggle the "View Chart" button to instantly visualize your numerical data in a bar chart without leaving the editor.
- **Filter and Sort**: Filter and sort data by column.

### 👀 Custom Variables Watch
The extension introduces a custom **Variables** view in the Debug panel:
- Quickly add variables by selecting text in your active editor.
- Rename, update, and remove tracked variables effortlessly.
- Instantly open complex objects into the full Table View directly from the watch panel by clicking the table icon next to the variable.
- Save and load variables.
