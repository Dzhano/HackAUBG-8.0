import { Header } from './components/Header';
import { Map } from './components/Map';
import { Footer } from './components/Footer';
import { Loader } from './components/common/Loader';
import { useStore } from './store/useStore';
import './App.css';

export const App = () => {
  const isLoading = useStore((s) => s.isLoading);

  return (
      <div className="flex flex-col min-h-screen font-sans text-gray-900">
          <Header />

          <Map />

          <Footer />

          {isLoading && <Loader />}
      </div>
  );
};
export default App
