import { useState, useEffect } from 'react'
import './App.css'

// Удалить SVGMap

function App() {
  const [tables, setTables] = useState({})
  const [hoveredTable, setHoveredTable] = useState(null)
  const getInitialDate = () => {
    const now = new Date()
    const currentHour = now.getHours()
    // Если сейчас между 00:00 и 12:00, показываем сегодня
    // Если после 23:30, показываем завтра
    if (currentHour >= 23 && now.getMinutes() >= 30) {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    }
    return now.toISOString().split('T')[0]
  }

  const getInitialTime = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    
    // Если сейчас рабочее время, устанавливаем ближайшее доступное время
    if (currentHour >= 12 && currentHour < 24) {
      const nextHalfHour = currentMinute < 30 ? 30 : 60
      const nextHour = currentMinute < 30 ? currentHour : currentHour + 1
      
      if (nextHour < 24) {
        return `${nextHour.toString().padStart(2, '0')}:${nextHalfHour === 30 ? '30' : '00'}`
      }
    }
    
    return '18:00'
  }
  
  const [selectedDate, setSelectedDate] = useState(getInitialDate())
  const [selectedTime, setSelectedTime] = useState(getInitialTime())
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
  const [carouselDirection, setCarouselDirection] = useState({})

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
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      if (!Array.isArray(data)) {
        throw new Error('API returned non-array data')
      }
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
      const tablePhotos = []
      let photoNum = 1
      // Пытаемся загрузить до 5 фото на стол (можно увеличить лимит при необходимости)
      for (let j = 1; j <= 5; j++) {
        // Проверяем, существует ли файл (косвенно, через try/catch Image)
        const img = new window.Image()
        img.src = `table-${i}/photo${j}.png`
        // В реальном проекте лучше сделать fetch HEAD или хранить список файлов на сервере
        tablePhotos.push(`table-${i}/photo${j}.png`)
        // Можно добавить проверку на 404, но для простоты добавляем все подряд
      }
      // Фильтруем только реально существующие фото (если нужно)
      photos[i] = tablePhotos.filter((src, idx) => idx === 0 || window.location.origin + '/'+ src)
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
      setCarouselDirection(prev => ({
        ...prev,
        [tableNumber]: 'next'
      }))
      // Сбрасываем направление после анимации
      setTimeout(() => {
        setCarouselDirection(prev => ({
          ...prev,
          [tableNumber]: null
        }))
      }, 300)
    }
  }

  const prevPhoto = (tableNumber) => {
    const photos = getTablePhotos(tableNumber)
    if (photos.length > 1) {
      setCurrentPhotoIndex(prev => ({
        ...prev,
        [tableNumber]: prev[tableNumber] === 0 ? photos.length - 1 : prev[tableNumber] - 1
      }))
      setCarouselDirection(prev => ({
        ...prev,
        [tableNumber]: 'prev'
      }))
      // Сбрасываем направление после анимации
      setTimeout(() => {
        setCarouselDirection(prev => ({
          ...prev,
          [tableNumber]: null
        }))
      }, 300)
    }
  }

  const handleTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
    // Предотвращаем скролл страницы при свайпе в карусели
    e.preventDefault()
  }

  const handleTouchEnd = (tableNumber) => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const minSwipeDistance = 30 // Уменьшаем минимальное расстояние для свайпа
    
    if (distance > minSwipeDistance) {
      nextPhoto(tableNumber)
    } else if (distance < -minSwipeDistance) {
      prevPhoto(tableNumber)
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
          customer_phone: bookingData.phone,
          telegram_id: window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString()
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
        }
        alert(`Стол №${selectedTable} успешно забронирован!`)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      const errorMsg = `Ошибка бронирования: ${error.message}`
      alert(errorMsg)
    }
  }

  // Координаты и размеры hot-spot'ов в процентах относительно restaurant-photo
  const tableHotspotStyles = {
    1: { top: '20%', left: '9.8%', width: '10.3%', height: '14%', borderRadius: '0', }, // прямоугольный
    2: { top: '13%', right: '7%', width: '26.5%', height: '17.5%', borderRadius: '0' }, // прямоугольный
    3: { top: '20%', left: '31%', width: '20%', height: '14.5%', borderRadius: '0' }, // прямоугольный
    4: { bottom: '24.4%', left: '8%', width: '10%', height: '12%', borderRadius: '0' }, // прямоугольный
    5: { bottom: '24%', left: '29.5%', width: '21.5%', height: '13%', borderRadius: '0' }, // прямоугольный
    6: { bottom: '14%', right: '8.8%', width: '4.5%', height: '6.5%', borderRadius: '50%' }, // круглый (бар)
    7: { bottom: '14%', right: '15.8%', width: '4.5%', height: '6.5%', borderRadius: '50%' }, // круглый (бар)
    8: { bottom: '14%', right: '22.8%', width: '4.5%', height: '6.5%', borderRadius: '50%' }, // круглый (бар)
    9: { bottom: '13.7%', right: '30.5%', width: '4.5%', height: '6.5%', borderRadius: '50%' }, // круглый (бар)
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
            {Array.from({length: 29}, (_, i) => {
              const hour = Math.floor(i / 2) + 12
              const minute = i % 2 === 0 ? '00' : '30'
              if (hour >= 27) return null // до 02:30 следующего дня
              
              const displayHour = hour >= 24 ? hour - 24 : hour
              const time = `${displayHour.toString().padStart(2, '0')}:${minute}`
              
              const selectedDay = new Date(selectedDate).getDay()
              const isWeekend = selectedDay === 0 || selectedDay === 6
              
              // Проверяем рабочие часы
              if (!isWeekend && displayHour >= 1 && displayHour < 12) return null // будни: 12:00-00:00
              if (isWeekend && displayHour >= 3 && displayHour < 12) return null // выходные: 12:00-02:00
              
              // Проверяем, не прошло ли время для сегодняшней даты
              const now = new Date()
              const selectedDateTime = new Date(`${selectedDate}T${time}`)
              if (selectedDate === now.toISOString().split('T')[0] && selectedDateTime < now) return null
              
              return { time, sortKey: displayHour === 0 ? -1 : (displayHour === 1 ? -0.5 : hour) }
            }).filter(Boolean).sort((a, b) => a.sortKey - b.sortKey).map(item => 
              <option key={item.time} value={item.time}>{item.time}</option>
            )}
          </select>
          <select 
            className="time-filter" 
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
          >
            <option value={2}>2 часа</option>
            <option value={4}>4 часа</option>
            <option value={6}>6 часов</option>
          </select>
        </div>
      </div>
      <div className="restaurant-photo">
        <img src="/restaurant-plan.png" alt="План ресторана" className="restaurant-image" />
        {Object.entries(tables).map(([tableNumber, table]) => (
          <div 
            key={tableNumber} 
            className={`table-hotspot ${table.status} ${table.type || ''}`}
            style={tableHotspotStyles[tableNumber]}
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
                    <div className="carousel-container">
                      {getTablePhotos(tableNumber).map((photo, index) => (
                        <img 
                          key={index}
                          src={photo} 
                          alt={`Стол ${tableNumber}`}
                          className={`table-photo ${index === (currentPhotoIndex[tableNumber] || 0) ? 'active' : ''}`}
                          style={{ 
                            transform: `translateX(${(index - (currentPhotoIndex[tableNumber] || 0)) * 100}%)`,
                            transition: carouselDirection[tableNumber] ? 'transform 0.3s ease-in-out' : 'none'
                          }}
                        />
                      ))}
                    </div>
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
                        <div className="carousel-indicators">
                          {getTablePhotos(tableNumber).map((_, index) => (
                            <div 
                              key={index}
                              className={`indicator ${index === (currentPhotoIndex[tableNumber] || 0) ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPhotoIndex(prev => ({ ...prev, [tableNumber]: index }));
                              }}
                            />
                          ))}
                        </div>
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
                <option value={4} disabled={(() => {
                  const selectedDay = new Date(selectedDate).getDay()
                  const isWeekend = selectedDay === 0 || selectedDay === 6
                  const startHour = parseInt(selectedTime.split(':')[0])
                  const endHour = startHour + 4
                  
                  if (!isWeekend) {
                    // Будни: работаем до 2:00
                    return startHour >= 22 || (startHour < 12 && endHour > 2)
                  } else {
                    // Выходные: работаем до 4:00
                    return startHour >= 24 || (startHour < 12 && endHour > 4)
                  }
                })()}>4 часа</option>
                <option value={6} disabled={(() => {
                  const selectedDay = new Date(selectedDate).getDay()
                  const isWeekend = selectedDay === 0 || selectedDay === 6
                  const startHour = parseInt(selectedTime.split(':')[0])
                  const endHour = startHour + 6
                  
                  if (!isWeekend) {
                    // Будни: работаем до 2:00
                    return startHour >= 20 || (startHour < 12 && endHour > 2)
                  } else {
                    // Выходные: работаем до 4:00
                    return startHour >= 22 || (startHour < 12 && endHour > 4)
                  }
                })()}>6 часов</option>
              </select>
            </div>
            <button 
              className="modal-btn"
              disabled={!bookingData.name || bookingData.phone.length < 12}
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
