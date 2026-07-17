import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) { return twMerge(clsx(inputs)); }

const AVATAR_CLASSES = ['bg-primary/15 text-primary', 'bg-info/15 text-info', 'bg-success/15 text-success', 'bg-purple/15 text-purple', 'bg-warning/15 text-warning'];
export function avatarClass(name) {
  return AVATAR_CLASSES[[...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_CLASSES.length];
}

const SOLID_CLASSES = ['bg-primary text-white', 'bg-info text-white', 'bg-success text-white', 'bg-purple text-white', 'bg-warning text-white', 'bg-destructive text-white'];
export function solidClass(name) {
  return SOLID_CLASSES[[...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % SOLID_CLASSES.length];
}
