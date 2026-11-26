// Small stroke icons, drawn on one 20px grid so they share weight and size.
const Icon = ({ children, size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
    {children}
  </svg>
);

export const PinIcon = (p) => <Icon {...p}><path d="M10 17.5s5.5-4.6 5.5-9a5.5 5.5 0 1 0-11 0c0 4.4 5.5 9 5.5 9Z" /><circle cx="10" cy="8.5" r="1.9" /></Icon>;
export const ClockIcon = (p) => <Icon {...p}><circle cx="10" cy="10" r="7" /><path d="M10 6.5V10l2.3 1.5" /></Icon>;
export const GripIcon = (p) => (
  <Icon {...p} stroke="none" fill="currentColor">
    {[6, 10, 14].map((y) => [7.5, 12.5].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.35" />))}
  </Icon>
);
export const ArrowUpIcon = (p) => <Icon {...p}><path d="M10 15.5v-11M5.5 9 10 4.5 14.5 9" /></Icon>;
export const ArrowDownIcon = (p) => <Icon {...p}><path d="M10 4.5v11M5.5 11l4.5 4.5 4.5-4.5" /></Icon>;
export const PencilIcon = (p) => <Icon {...p}><path d="m12.5 4.5 3 3M4 16l.8-3.6 8.6-8.6a1.4 1.4 0 0 1 2 0l.8.8a1.4 1.4 0 0 1 0 2l-8.6 8.6L4 16Z" /></Icon>;
export const TrashIcon = (p) => <Icon {...p}><path d="M4 6h12M8 6V4.5h4V6M5.5 6l.7 9.5h7.6l.7-9.5M8.5 9v4M11.5 9v4" /></Icon>;
export const CheckIcon = (p) => <Icon {...p}><path d="m4.5 10.5 3.5 3.5 7.5-8" /></Icon>;
export const PlusIcon = (p) => <Icon {...p}><path d="M10 4v12M4 10h12" /></Icon>;
export const InfoIcon = (p) => <Icon {...p}><circle cx="10" cy="10" r="7" /><path d="M10 9v4.5M10 6.6v.1" /></Icon>;
export const FlagIcon = (p) => <Icon {...p}><path d="M5 17V3.5M5 4h9l-2 3.25L14 10.5H5" /></Icon>;
export const RouteIcon = (p) => <Icon {...p}><circle cx="5.5" cy="15" r="2" /><circle cx="14.5" cy="5" r="2" /><path d="M7.5 15h4a2.5 2.5 0 0 0 0-5h-3a2.5 2.5 0 0 1 0-5h4" /></Icon>;
export const BagIcon = (p) => <Icon {...p}><path d="M4.5 7h11l-.8 9.5H5.3L4.5 7ZM7.5 7V6a2.5 2.5 0 0 1 5 0v1" /></Icon>;

// Status icons: a status colour never carries meaning alone.
export const ConflictIcon = (p) => <Icon {...p}><circle cx="10" cy="10" r="7" /><path d="M10 6.5v4M10 13.4v.1" /></Icon>;
export const WarningIcon = (p) => <Icon {...p}><path d="M10 3.5 17 16H3l7-12.5Z" /><path d="M10 8.5v3M10 13.9v.1" /></Icon>;
export const OkIcon = (p) => <Icon {...p}><circle cx="10" cy="10" r="7" /><path d="m7 10.2 2 2 4-4.4" /></Icon>;

export function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path d="M9 23c0-5 14-3 14-9.5S15 7 12 9" fill="none" stroke="var(--accent-ink)" strokeWidth="2.4"
        strokeLinecap="round" strokeDasharray="0.1 4.4" />
      <circle cx="9" cy="23" r="3" fill="var(--accent-ink)" />
      <circle cx="12" cy="9" r="3" fill="var(--accent-ink)" />
    </svg>
  );
}
