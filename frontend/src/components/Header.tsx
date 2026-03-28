import { useStore } from '../store/useStore';
export const Header = () => {
    const startPoint = useStore(state => state.start);
    const endPoint = useStore(state => state.end);
    const fetchRoutes = useStore(state => state.fetchRoutes);

    function handleSubmit() {
        fetchRoutes();
    }

    return (
        <header className="flex items-center justify-between p-4 bg-white border-b shadow-md sticky top-0 z-10">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg text-white font-black italic shadow-inner">
                SafeWay
            </div>

            {/* Address Inputs */}
            <div className="flex flex-1 max-w-3xl mx-8 gap-3">
                <div className="flex-1 relative">
                    <input
                        list="photon-data"
                        type="text"
                        placeholder="Starting point (Sofia)..."
                        className="w-full px-4 py-2 bg-gray-100 border border-transparent rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={startPoint.lat + ', ' + startPoint.lng}
                        readOnly
                        // onChange={(e) => { setAddr1(e.target.value); getAutofill(e.target.value); }}
                    />
                </div>
                
                <div className="flex-1 relative">
                    <input
                        list="photon-data"
                        type="text"
                        placeholder="Destination..."
                        className="w-full px-4 py-2 bg-gray-100 border border-transparent rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={endPoint.lat + ', ' + endPoint.lng}
                        readOnly
                        // onChange={(e) => { setAddr2(e.target.value); getAutofill(e.target.value); }}
                    />
                </div>

                <button 
                    onClick={handleSubmit}
                    className="px-8 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 shadow-lg active:scale-95 transition-all"
                >
                    Go!
                </button>
            </div>
        </header>
    );
}