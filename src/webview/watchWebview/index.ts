import { watchStyles } from './styles';
import { watchScripts } from './scripts';
import { watchTemplate } from './template';

export function getWatchWebviewContent(): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Variables Watch View</title>
        <style>
${watchStyles}
        </style>
    </head>
    <body style="margin: 0; padding: 0; display: flex; flex-direction: column; overflow: hidden; height: 100vh;">
${watchTemplate}
        <script>
${watchScripts}
        </script>
    </body>
    </html>`;
}
