import { openDB, type DBSchema } from 'idb';
import type { Message } from '../store/useChatStore';

interface ChatDB extends DBSchema {
    messages: {
        key: string;
        value: Message & { chatId: string };
        indexes: { 'by-chat': string };
    };
    contacts: {
        key: string;
        value: {
            id: string;
            name: string;
            address: string;
            publicKey?: string;
        };
    };
}

const DB_NAME = 'cypher_text_db';
const DB_VERSION = 1;

export const initDB = async () => {
    return openDB<ChatDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('messages')) {
                const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
                msgStore.createIndex('by-chat', 'chatId');
            }
            if (!db.objectStoreNames.contains('contacts')) {
                db.createObjectStore('contacts', { keyPath: 'id' });
            }
        },
    });
};

export const storageService = {
    async saveMessage(chatId: string, message: Message) {
        const db = await initDB();
        await db.put('messages', { ...message, chatId });
    },

    async getMessages(chatId: string) {
        const db = await initDB();
        return db.getAllFromIndex('messages', 'by-chat', chatId);
    },

    async saveContact(contact: any) {
        const db = await initDB();
        await db.put('contacts', contact);
    },

    async getContacts() {
        const db = await initDB();
        return db.getAll('contacts');
    }
};
