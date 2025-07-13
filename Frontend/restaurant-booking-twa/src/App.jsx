import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [tables, setTables] = useState({
    1: { seats: 4, status: 'available' },
    2: { seats: 2, status: 'available' },
    3: { seats: 6, status: 'booked' },
    4: { seats: 8, status: 'available' }
  })
  const [hoveredTable, setHoveredTable] = useState(null)

  useEffect(() => {
    // Инициализация Telegram Web App
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand()
    }
  }, [])

  const bookTable = (tableNumber) => {
    const table = tables[tableNumber]
    
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showConfirm(
        `Забронировать стол №${tableNumber} на ${table.seats} мест?`,
        (confirmed) => {
          if (confirmed) {
            setTables(prev => ({
              ...prev,
              [tableNumber]: { ...prev[tableNumber], status: 'booked' }
            }))
            
            window.Telegram.WebApp.sendData(JSON.stringify({
              action: 'book_table',
              table: tableNumber,
              seats: table.seats,
              timestamp: new Date().toISOString()
            }))
            
            window.Telegram.WebApp.showAlert(`Стол №${tableNumber} успешно забронирован!`)
          }
        }
      )
    } else {
      // Для тестирования без Telegram
      if (confirm(`Забронировать стол №${tableNumber} на ${table.seats} мест?`)) {
        setTables(prev => ({
          ...prev,
          [tableNumber]: { ...prev[tableNumber], status: 'booked' }
        }))
        alert(`Стол №${tableNumber} успешно забронирован!`)
      }
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Бронирование столов</h1>
        <div className="filters">
          <input type="date" className="date-filter" />
          <input type="time" className="time-filter" />
        </div>
      </div>
      <div className="restaurant-room">
        <div className="room-walls">
          <div className="wall wall-top"></div>
          <div className="wall wall-right"></div>
          <div className="wall wall-bottom"></div>
          <div className="wall wall-left"></div>
          <div className="window window-top"></div>
          <div className="window window-right"></div>
        </div>
        <div className="restaurant-layout">
          {Object.entries(tables).map(([tableNumber, table]) => (
            <div 
              key={tableNumber} 
              className={`table-card seats-${table.seats} ${table.status}`}
              style={{
                gridArea: `table${tableNumber}`,
              }}
              onMouseEnter={() => setHoveredTable(tableNumber)}
              onMouseLeave={() => setHoveredTable(null)}
              onClick={() => setHoveredTable(hoveredTable === tableNumber ? null : tableNumber)}
            >
              {hoveredTable === tableNumber && (
                <>
                  <p>{table.seats} мест</p>
                  <button 
                    className="book-btn" 
                    disabled={table.status === 'booked'}
                    onClick={(e) => {
                      e.stopPropagation()
                      bookTable(tableNumber)
                    }}
                  >
                    {table.status === 'available' ? 'Бронь' : 'Занят'}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
