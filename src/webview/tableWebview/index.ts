import { tableStyles } from './styles';
import { tableScripts } from './scripts';
import { tableTemplate } from './template';

export function getTableWebviewContent(): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Table View</title>
        <style>
${tableStyles}
        </style>
    </head>
    <body style="margin: 0; padding: 0; display: flex; flex-direction: column; overflow: hidden; height: 100vh;">
${tableTemplate}
        <script>
${tableScripts}
        </script>
    </body>
    </html>`;
}
