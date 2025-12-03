export interface Command {
    name: string;
    args: string[];
    rawInput: string;
}

export class CommandParser {
    static parse(text: string): Command | null {
        if (!text.startsWith('#')) return null;

        // Remove the leading #
        const cleanText = text.slice(1);

        // Split by spaces, but respect quotes if we wanted to be fancy (keeping it simple for now)
        const parts = cleanText.trim().split(/\s+/);

        if (parts.length === 0 || !parts[0]) return null;

        const name = parts[0].toLowerCase();
        const args = parts.slice(1);

        return {
            name,
            args,
            rawInput: text
        };
    }
}
