import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [tables, setTables] = useState({})
  const [hoveredTable, setHoveredTable] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState('18:00')
  const [selectedDuration, setSelectedDuration] = useState(2)
  const [showRules, setShowRules] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [rulesAccepted, setRulesAccepted] = useState(false)
  const [bookingData, setBookingData] = useState({ name: '', phone: '+7 ', duration: 2 })
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState({})
  const [availablePhotos, setAvailablePhotos] = useState({})
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  useEffect(() => {
    // Инициализация Telegram Web App
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand()
    }
    fetchTables()
    loadTablePhotos()
  }, [selectedDate, selectedTime, selectedDuration])

  const fetchTables = async () => {
    try {
      const response = await fetch(`/api/tables?date=${selectedDate}&time=${selectedTime}&duration=${selectedDuration}`)
      const data = await response.json()
      const tablesData = {}
      data.forEach(table => {
        tablesData[table.id] = {
          seats: table.seats,
          status: table.status,
          type: table.seats === 1 ? 'bar' : undefined
        }
      })
      setTables(tablesData)
    } catch (error) {
      console.error('Ошибка загрузки столов:', error)
      // Fallback данные для тестирования
      const fallbackTables = {
        1: { seats: 4, status: 'available' },
        2: { seats: 2, status: 'available' },
        3: { seats: 6, status: 'available' },
        4: { seats: 8, status: 'available' },
        5: { seats: 8, status: 'available' },
        6: { seats: 1, status: 'available', type: 'bar' },
        7: { seats: 1, status: 'available', type: 'bar' },
        8: { seats: 1, status: 'available', type: 'bar' },
        9: { seats: 1, status: 'available', type: 'bar' }
      }

      setTables(fallbackTables)
    }
  }

  const bookTable = (tableNumber) => {
    setSelectedTable(tableNumber)
    setShowRules(true)
    setHoveredTable(null)
  }

  const handleRulesAccept = () => {
    if (rulesAccepted) {
      setShowRules(false)
      setBookingData({ ...bookingData, duration: selectedDuration })
      setShowBookingForm(true)
    }
  }

  const getTablePhotos = (tableNumber) => {
    return availablePhotos[tableNumber] || []
  }

  const loadTablePhotos = () => {
    const photos = {}
    const photoIndex = {}
    for (let i = 1; i <= 9; i++) {
      photos[i] = [`table-${i}/photo1.png`]
      photoIndex[i] = 0
    }
    setAvailablePhotos(photos)
    setCurrentPhotoIndex(photoIndex)
  }

  const nextPhoto = (tableNumber) => {
    const photos = getTablePhotos(tableNumber)
    if (photos.length > 1) {
      setCurrentPhotoIndex(prev => ({
        ...prev,
        [tableNumber]: (prev[tableNumber] + 1) % photos.length
      }))
    }
  }

  const prevPhoto = (tableNumber) => {
    const photos = getTablePhotos(tableNumber)
    if (photos.length > 1) {
      setCurrentPhotoIndex(prev => ({
        ...prev,
        [tableNumber]: prev[tableNumber] === 0 ? photos.length - 1 : prev[tableNumber] - 1
      }))
    }
  }

  const handleTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = (tableNumber) => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    
    if (isLeftSwipe || isRightSwipe) {
      nextPhoto(tableNumber)
    }
  }

  const submitBooking = async () => {
    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          table_id: parseInt(selectedTable),
          booking_date: selectedDate,
          booking_time: selectedTime,
          duration: bookingData.duration,
          customer_name: bookingData.name,
          customer_phone: bookingData.phone
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setShowBookingForm(false)
        setRulesAccepted(false)
        setBookingData({ name: '', phone: '+7 ', duration: 2 })
        fetchTables()
        
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.sendData(JSON.stringify({
            action: 'book_table',
            table: selectedTable,
            date: selectedDate,
            time: selectedTime,
            timestamp: new Date().toISOString()
          }))
          window.Telegram.WebApp.showAlert(`Стол №${selectedTable} успешно забронирован!`)
        } else {
          alert(`Стол №${selectedTable} успешно забронирован!`)
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      const errorMsg = `Ошибка бронирования: ${error.message}`
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(errorMsg)
      } else {
        alert(errorMsg)
      }
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Бронирование столов</h1>
        <div className="filters">
          <input 
            type="date" 
            className="date-filter" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          <select 
            className="time-filter" 
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
          >
            {Array.from({length: 24}, (_, i) => {
              const hour = Math.floor(i / 2) + 10
              const minute = i % 2 === 0 ? '00' : '30'
              if (hour >= 22) return null
              const time = `${hour.toString().padStart(2, '0')}:${minute}`
              
              // Проверяем, не прошло ли время для сегодняшней даты
              const now = new Date()
              const selectedDateTime = new Date(`${selectedDate}T${time}`)
              if (selectedDateTime < now) return null
              
              return <option key={time} value={time}>{time}</option>
            }).filter(Boolean)}
          </select>
          <select 
            className="time-filter" 
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
          >
            <option value={2}>2 часа</option>
            <option value={4}>4 часа</option>
            <option value={6}>6 часов</option>
            <option value={8}>8 часов</option>
          </select>
        </div>
      </div>
      <div className="restaurant-photo">
        <img src="ChatGPT Image 13 июля 2025 г., 11_14_49.png" alt="План ресторана" className="restaurant-image" />
        {Object.entries(tables).map(([tableNumber, table]) => (
          <div 
            key={tableNumber} 
            className={`table-hotspot table-${tableNumber} ${table.status} ${table.type || ''}`}
            onMouseEnter={() => setHoveredTable(tableNumber)}
            onMouseLeave={() => setHoveredTable(null)}
            onClick={() => setHoveredTable(hoveredTable === tableNumber ? null : tableNumber)}
          >
            {hoveredTable === tableNumber && (
              <div className="table-info">
                {getTablePhotos(tableNumber).length > 0 && (
                  <div 
                    className="photo-carousel"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={() => handleTouchEnd(tableNumber)}
                  >
                    {getTablePhotos(tableNumber).map((photo, index) => (
                      <img 
                        key={index}
                        src={photo} 
                        alt={`Стол ${tableNumber}`}
                        className={`table-photo ${index === (currentPhotoIndex[tableNumber] || 0) ? 'active' : ''}`}
                      />
                    ))}
                    {getTablePhotos(tableNumber).length > 1 && (
                      <>
                        <div 
                          className="carousel-arrow carousel-prev"
                          onClick={(e) => { e.stopPropagation(); prevPhoto(tableNumber); }}
                        >‹</div>
                        <div 
                          className="carousel-arrow carousel-next"
                          onClick={(e) => { e.stopPropagation(); nextPhoto(tableNumber); }}
                        >›</div>
                      </>
                    )}
                  </div>
                )}
                <p>{table.seats} {table.type === 'bar' ? 'место' : 'мест'}</p>
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
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Модальное окно правил */}
      {showRules && (
        <div className="modal-overlay" onClick={() => setShowRules(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Правила заведения</h2>
            <p>Здесь ваши правила</p>
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
              />
              Я прочитал и принимаю правила заведения
            </label>
            <button 
              className="modal-btn"
              disabled={!rulesAccepted}
              onClick={handleRulesAccept}
            >
              Забронировать
            </button>
          </div>
        </div>
      )}
      
      {/* Модальное окно формы бронирования */}
      {showBookingForm && (
        <div className="modal-overlay" onClick={() => setShowBookingForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Бронирование стола №{selectedTable}</h2>
            <div className="booking-info">
              <p>Дата: {selectedDate}</p>
              <p>Время: {selectedTime}</p>
            </div>
            <input 
              type="text" 
              placeholder="Ваше имя"
              value={bookingData.name}
              onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
              className="form-input"
            />
            <input 
              type="tel" 
              placeholder="+7 111 111 11 11"
              value={bookingData.phone}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '')
                if (!value.startsWith('7')) value = '7' + value
                if (value.length > 11) value = value.slice(0, 11)
                const formatted = value.length > 1 ? 
                  `+7 ${value.slice(1, 4)} ${value.slice(4, 7)} ${value.slice(7, 9)} ${value.slice(9, 11)}`.trim() : '+7 '
                setBookingData({...bookingData, phone: formatted})
              }}
              className="form-input"
            />
            <div className="duration-selector">
              <label>Продолжительность:</label>
              <select 
                value={bookingData.duration}
                onChange={(e) => setBookingData({...bookingData, duration: parseInt(e.target.value)})}
                className="form-select"
              >
                <option value={2}>2 часа</option>
                <option value={4}>4 часа</option>
                <option value={6}>6 часов</option>
                <option value={8}>8 часов</option>
              </select>
            </div>
            <button 
              className="modal-btn"
              disabled={!bookingData.name || bookingData.phone.length < 18}
              onClick={submitBooking}
            >
              Подтвердить бронирование
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
