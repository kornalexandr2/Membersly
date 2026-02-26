import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

function App() {
  const { t, i18n } = useTranslation();
  const [initData, setInitData] = useState<string>('');

  useEffect(() => {
    // Check if running in Telegram WebApp
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      setInitData(tg.initData);
      
      // Update theme
      document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
      document.body.style.color = tg.themeParams.text_color || '#000000';
    }
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">{t('welcome')}</h1>
      <div className="flex gap-2 mb-4">
        <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => changeLanguage('ru')}>RU</button>
        <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => changeLanguage('en')}>EN</button>
      </div>
      <div className="p-4 border rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-2">{t('tariffs')}</h2>
        {/* Placeholder for tariffs list */}
        <div className="mb-2 p-2 bg-gray-100 rounded text-gray-800">Premium 1M - 500 RUB</div>
        <div className="mb-2 p-2 bg-gray-100 rounded text-gray-800">VIP 1M - 1500 RUB</div>
      </div>
      {initData && (
        <div className="mt-4 text-xs text-gray-500 overflow-hidden text-ellipsis w-full max-w-md">
          Tg InitData: {initData}
        </div>
      )}
    </div>
  )
}

export default App