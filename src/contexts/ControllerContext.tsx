import React, { createContext, useContext, useEffect, useState } from 'react';
import { Controller } from '../core/Controller';

interface ControllerContextType {
    controller: Controller | null;
    isReady: boolean;
}

const ControllerContext = createContext<ControllerContextType>({
    controller: null,
    isReady: false
});

export const useController = () => useContext(ControllerContext);

interface ControllerProviderProps {
    controller: Controller | null;
    children: React.ReactNode;
}

export const ControllerProvider: React.FC<ControllerProviderProps> = ({ controller, children }) => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (controller) {
            setIsReady(true);
        }
    }, [controller]);

    return (
        <ControllerContext.Provider value={{ controller, isReady }}>
            {children}
        </ControllerContext.Provider>
    );
};
