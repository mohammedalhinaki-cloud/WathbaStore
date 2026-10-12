"use client";
import { createContext, useContext } from "react";
export const SetupSaveContext = createContext({ saved: () => {}, dirty: () => {} });
export function useSetupSave() { return useContext(SetupSaveContext); }
