export const Z_INDEX = {
  base: 0,
  content: 1,
  sticky: 10,
  sidebar: 20,
  topbar: 30,
  popover: 40,
  dropdown: 40,
  tooltip: 50,
  modalBackdrop: 60,
  modal: 70,
  toast: 80,
  loader: 100,
} as const;

export type ZIndexToken = keyof typeof Z_INDEX;