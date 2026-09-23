import { useDispatch, useSelector } from 'react-redux';

/**
 * Redux Hooks
 * Use these instead of plain useDispatch and useSelector
 * These are convenience hooks for consistent usage
 */

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

