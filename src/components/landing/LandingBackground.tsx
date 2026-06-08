export default function LandingBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-24 -left-24 w-[520px] h-[520px] bg-purple-200 opacity-40 rounded-full blur-[100px]" />
      <div className="absolute -top-12 -right-32 w-[620px] h-[520px] bg-purple-200 opacity-35 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 -left-16 w-[420px] h-[320px] bg-purple-200 opacity-30 rounded-full blur-[80px] rotate-12" />
      <div className="absolute top-1/2 -right-20 w-[460px] h-[360px] bg-purple-200 opacity-30 rounded-full blur-[90px] -rotate-12" />
      <div className="absolute bottom-0 left-0 w-[520px] h-[420px] bg-purple-200 opacity-35 rounded-full blur-[100px]" />
      <div className="absolute top-24 left-1/4 w-[420px] h-[420px] bg-white opacity-25 rounded-full blur-[90px]" />
    </div>
  );
}
