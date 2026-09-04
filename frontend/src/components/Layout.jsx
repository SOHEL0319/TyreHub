import Navbar from './Navbar';
import Footer from './Footer';
import Chatbot from './Chatbot';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-[80px]">
        {children}
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}
