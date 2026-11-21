type Props = {
  icon: string;
  className?: string;
};

export default function ActivityIcon({ icon, className = 'w-4 h-4' }: Props) {
  const path = (() => {
    switch (icon) {
      case 'stop':
        return 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10h6v4H9z';
      case 'clock':
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'hourglass':
        return 'M12 8v4l2 2M6 4h12M6 20h12M8 4v2a4 4 0 002.343 3.657L12 11l1.657-1.343A4 4 0 0016 6V4M8 20v-2a4 4 0 012.343-3.657L12 13l1.657 1.343A4 4 0 0116 18v2';
      case 'branch':
        return 'M6 3v12a3 3 0 003 3h3m6-15v4a3 3 0 01-3 3H9m6 9v-4a3 3 0 00-3-3H9';
      case 'variable':
        return 'M4 7h16M4 12h10M4 17h7';
      case 'email':
        return 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
      case 'whatsapp':
        return 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z';
      case 'phone':
        return 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z';
      case 'document':
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'signature':
        return 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z';
      case 'calendar':
        return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
      case 'spark':
        return 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z';
      case 'chat':
        return 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z';
      default:
        return 'M13 10V3L4 14h7v7l9-11h-7z';
    }
  })();

  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={path} />
    </svg>
  );
}
