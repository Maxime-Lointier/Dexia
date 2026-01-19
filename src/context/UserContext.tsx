import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    UserProfile,
    getAllUsers,
    getUserPreferences,
    createNewUser,
    deleteUser,
    getOrCreateUser,
    resetApplicationData,
    CURRENT_USER_ID
} from '../models/user';

interface UserContextType {
    currentUser: UserProfile | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    users: UserProfile[];
    isLoading: boolean;
    switchUser: (userId: number) => Promise<void>;
    addUser: (name: string) => Promise<void>;
    removeUser: (userId: number) => Promise<boolean>;
    logout: () => void;
    refreshUsers: () => Promise<void>;
    resetApp: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const LAST_USER_KEY = 'DEXIA_LAST_USER_ID';

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Charger les utilisateurs
    useEffect(() => {
        initSession();
    }, []);

    const initSession = async () => {
        setIsLoading(true);
        try {
            // Charger tous les profils
            const allUsers = await getAllUsers();
            setUsers(allUsers);


            console.log('👤 Chargement terminé, pas d\'auto-login demandé.');

        } catch (error) {
            console.error('Erreur init session:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshUsers = async () => {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
    };

    const switchUser = async (userId: number) => {
        setIsLoading(true);
        try {
            // Recharger la liste
            const allUsers = await getAllUsers();
            const user = allUsers.find(u => u.id === userId);

            if (user) {
                setCurrentUser(user);
                setUsers(allUsers);
                await AsyncStorage.setItem(LAST_USER_KEY, userId.toString());
                console.log(`🔄 User switché vers ID ${userId}`);
            }
        } catch (error) {
            console.error('Erreur switchUser:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addUser = async (name: string) => {
        try {
            const newId = await createNewUser(name);
            await refreshUsers();
            await switchUser(newId);
        } catch (error) {
            console.error('Erreur addUser:', error);
            throw error;
        }
    };

    const removeUser = async (userId: number) => {
        try {
            const success = await deleteUser(userId);
            if (success) {
                // Si on supprime l'user courant, logout
                if (currentUser?.id === userId) {
                    logout();
                }
                await refreshUsers();
            }
            return success;
        } catch (error) {
            console.error('Erreur removeUser:', error);
            return false;
        }
    };

    const logout = async () => {
        setCurrentUser(null);
        await AsyncStorage.removeItem(LAST_USER_KEY);
    };

    const resetApp = async () => {
        try {
            // 1. Reset DB
            await resetApplicationData();

            // 2. Clear Local Storage
            await AsyncStorage.removeItem(LAST_USER_KEY);

            // 3. Reset State
            setCurrentUser(null);
            setUsers([]);

            console.log('☢️ App entièrement réinitialisée');
        } catch (error) {
            console.error('Erreur resetApp:', error);
        }
    };

    return (
        <UserContext.Provider value={{ currentUser,setCurrentUser, users, isLoading, switchUser, addUser, removeUser, logout, refreshUsers, resetApp }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser doit être utilisé dans un UserProvider');
    }
    return context;
}
