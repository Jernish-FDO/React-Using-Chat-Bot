import { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SettingsSidebar } from './SettingsSidebar';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Dynamic sidebar based on screen size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleSettings = () => setIsSettingsOpen(!isSettingsOpen);

    return (
        <div className="flex h-screen bg-bg-app text-text-primary overflow-hidden relative">
            {/* Left Sidebar */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Right Settings Sidebar */}
            <SettingsSidebar
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            {/* Main content */}
            <div className={`flex-1 flex flex-col min-w-0 h-full relative transition-all duration-300 ${isSidebarOpen ? 'lg:pl-[280px]' : 'lg:pl-0'}`}>
                {/* Header */}
                <Header
                    onToggleSidebar={toggleSidebar}
                    onToggleSettings={toggleSettings}
                />

                {/* Page content */}
                <main className="flex-1 flex flex-col overflow-hidden relative">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default MainLayout;
