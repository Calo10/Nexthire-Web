export default function LandingWhatsAppVisual() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-lg shadow-emerald-500/5 overflow-hidden">
      <div className="flex items-center gap-3 bg-emerald-600 px-4 py-3 text-white">
        <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
          <img
            src="https://cdn.simpleicons.org/whatsapp/white"
            alt=""
            className="h-5 w-5"
            loading="lazy"
          />
        </div>
        <div>
          <p className="text-sm font-semibold">NextHire Apply Bot</p>
          <p className="text-[11px] text-emerald-100">Online · Product Designer role</p>
        </div>
      </div>

      <div className="bg-[#ece5dd] p-4 space-y-3 min-h-[260px]">
        <div className="max-w-[85%] rounded-lg rounded-tl-none bg-white px-3 py-2 shadow-sm">
          <p className="text-xs text-gray-800">
            Hi! 👋 I can help you apply for <span className="font-semibold">Product Designer</span>. Ready to start?
          </p>
          <p className="text-[10px] text-gray-400 mt-1 text-right">10:02</p>
        </div>
        <div className="max-w-[85%] ml-auto rounded-lg rounded-tr-none bg-[#dcf8c6] px-3 py-2 shadow-sm">
          <p className="text-xs text-gray-800">Yes, I want to apply</p>
          <p className="text-[10px] text-gray-500 mt-1 text-right">10:02 ✓✓</p>
        </div>
        <div className="max-w-[85%] rounded-lg rounded-tl-none bg-white px-3 py-2 shadow-sm">
          <p className="text-xs text-gray-800">Great! What is your full name?</p>
          <p className="text-[10px] text-gray-400 mt-1 text-right">10:02</p>
        </div>
        <div className="max-w-[85%] ml-auto rounded-lg rounded-tr-none bg-[#dcf8c6] px-3 py-2 shadow-sm">
          <p className="text-xs text-gray-800">Maria Lopez</p>
          <p className="text-[10px] text-gray-500 mt-1 text-right">10:03 ✓✓</p>
        </div>
        <div className="max-w-[85%] rounded-lg rounded-tl-none bg-white px-3 py-2 shadow-sm border border-primary/20">
          <p className="text-xs text-gray-800">
            Thanks! How many years of UX experience do you have?
          </p>
          <p className="text-[10px] text-primary mt-1 font-medium">Bot question · saved to pipeline</p>
        </div>
      </div>
    </div>
  );
}
