export const Loader = () => (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-auto">
        <div className="flex flex-col items-center gap-3 bg-white rounded-2xl px-8 py-6 shadow-xl">
            <svg
                className="animate-spin h-10 w-10 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
            </svg>
            <span className="text-sm font-medium text-gray-700">Finding routes...</span>
        </div>
    </div>
);