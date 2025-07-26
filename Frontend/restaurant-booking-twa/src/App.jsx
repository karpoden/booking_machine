import { useState, useEffect } from 'react'
import './App.css'

// Удалить SVGMap

function SVGMap({ tables, hoveredTable, setHoveredTable, bookTable, getTablePhotos, currentPhotoIndex, nextPhoto, prevPhoto, showTableInfo }) {
  const [localHovered, setLocalHovered] = useState(null);
  // Координаты и размеры hotspot'ов в абсолютных px относительно SVG (размеры SVG: 1000x700)
  const tableShapes = [
    { id: 1, type: 'rect', x: 99,  y: 150,  w: 101,  h: 100 }, // левый верх
    { id: 2, type: 'rect', x: 311, y: 150,  w: 200, h: 95  }, // центр верх
    { id: 3, type: 'rect', x: 670, y: 110,  w: 257, h: 110 }, // правый верх
    { id: 4, type: 'rect', x: 80,  y: 450, w: 100,  h: 80 }, // левый низ
    { id: 5, type: 'rect', x: 300, y: 450, w: 210, h: 80  }, // центр низ
    { id: 6, type: 'ellipse', cx: 673, cy: 580, rx: 25, ry: 25 }, // бар 1
    { id: 7, type: 'ellipse', cx: 750, cy: 580, rx: 25, ry: 25 }, // бар 2
    { id: 8, type: 'ellipse', cx: 820, cy: 580, rx: 25, ry: 25 }, // бар 3
    { id: 9, type: 'ellipse', cx: 890, cy: 580, rx: 25, ry: 25 }, // бар 4
  ]
  return (
    <svg viewBox="0 0 1000 700" width="100%" height="100%" style={{ display: 'block', borderRadius: 8, background: 'none' }}>
      <image href="/restaurant-plan.png" x="0" y="0" width="1000" height="700" />
      {tableShapes.map(shape => {
        const table = tables[shape.id]
        if (!table) return null
        const isHovered = (hoveredTable === String(shape.id)) || (localHovered === String(shape.id))
        const status = table.status
        const fill = status === 'booked' ? 'rgba(231,76,60,0.25)' : 'rgba(46,204,113,0.25)'
        const stroke = status === 'booked' ? 'rgba(231,76,60,0.9)' : 'rgba(46,204,113,0.9)'
        const commonProps = {
          style: { cursor: 'pointer', filter: isHovered ? 'drop-shadow(0 0 12px #2ecc71)' : 'none' },
          fill, stroke, strokeWidth: 4,
          onMouseEnter: () => { setHoveredTable(String(shape.id)); setLocalHovered(String(shape.id)); },
          onMouseLeave: (e) => {
            // Если мышь ушла на info-блок, не скрываем
            const related = e.relatedTarget;
            if (related && related.closest && related.closest('.table-info')) return;
            setLocalHovered(null); setHoveredTable(null);
          },
          onClick: () => setHoveredTable(isHovered ? null : String(shape.id)),
        }
        return shape.type === 'rect' ? (
          <rect key={shape.id} x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={10} {...commonProps} />
        ) : (
          <ellipse key={shape.id} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...commonProps} />
        )
      })}
      {/* Инфо о столе поверх SVG */}
      {tableShapes.map(shape => {
        const table = tables[shape.id]
        if (!table) return null
        const isHovered = (hoveredTable === String(shape.id)) || (localHovered === String(shape.id))
        if (!isHovered) return null
        // Позиция info-блока
        const infoX = shape.type === 'rect' ? shape.x + shape.w/2 : shape.cx
        const infoY = shape.type === 'rect' ? shape.y : shape.cy
        return (
          <foreignObject key={'info-'+shape.id} x={infoX-90} y={infoY-110} width={180} height={120}>
            <div className="table-info"
              onMouseEnter={() => setLocalHovered(String(shape.id))}
              onMouseLeave={(e) => {
                // Если мышь ушла на hotspot, не скрываем
                const related = e.relatedTarget;
                if (related && (related.closest && (related.closest('rect') || related.closest('ellipse')))) return;
                setLocalHovered(null); setHoveredTable(null);
              }}
            >
              {getTablePhotos(shape.id).length > 0 && (
                <div className="photo-carousel"
                  onTouchStart={e => showTableInfo.handleTouchStart(e)}
                  onTouchMove={e => showTableInfo.handleTouchMove(e)}
                  onTouchEnd={(e) => {
                    showTableInfo.handleTouchEnd(shape.id);
                    
                    // Обработка клика на мобильных устройствах
                    if (touchStart && touchEnd) {
                      const distance = Math.abs(touchStart - touchEnd);
                      if (distance < 10) { // Если это был тап, а не свайп
                        const rect = e.currentTarget.getBoundingClientRect();
                        const touchX = e.changedTouches[0].clientX - rect.left;
                        const centerX = rect.width / 2;
                        
                        if (touchX < centerX) {
                          prevPhoto(shape.id);
                        } else {
                          nextPhoto(shape.id);
                        }
                      }
                    }
                  }}
                  onClick={(e) => {
                    // Обработка клика на десктопе
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const centerX = rect.width / 2;
                    
                    if (clickX < centerX) {
                      prevPhoto(shape.id);
                    } else {
                      nextPhoto(shape.id);
                    }
                  }}
                >
                  {getTablePhotos(shape.id).map((photo, index) => (
                    <img key={index} src={photo} alt={`Стол ${shape.id}`} className={`table-photo ${index === (currentPhotoIndex[shape.id] || 0) ? 'active' : ''}`} style={{ display: index === (currentPhotoIndex[shape.id] || 0) ? 'block' : 'none' }} />
                  ))}
                  {getTablePhotos(shape.id).length > 1 && (
                    <>
                      <div className="carousel-arrow carousel-prev" onClick={e => { e.stopPropagation(); prevPhoto(shape.id); }}>‹</div>
                      <div className="carousel-arrow carousel-next" onClick={e => { e.stopPropagation(); nextPhoto(shape.id); }}>›</div>
                    </>
                  )}
                </div>
              )}
              <p>{table.seats} {table.type === 'bar' ? 'место' : 'мест'}</p>
              <button className="book-btn" disabled={table.status === 'booked'} onClick={e => { e.stopPropagation(); bookTable(shape.id); }}>
                {table.status === 'available' ? 'Бронь' : 'Занят'}
              </button>
            </div>
          </foreignObject>
        )
      })}
    </svg>
  )
}

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

  useEffect(() => {
    // Инициализация Telegram Web App
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand()
    }
    fetchTables()
    loadTablePhotos()
    
    // Добавляем обработчик изменения размера окна
    const handleResize = () => {
      // Принудительно перерисовываем hotspot'ы
      const restaurantPhoto = document.querySelector('.restaurant-photo')
      if (restaurantPhoto) {
        restaurantPhoto.style.transform = 'translateZ(0)'
      }
    }
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
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

  const loadTablePhotos = async () => {
    const photos = {}
    const photoIndex = {}
    for (let i = 1; i <= 9; i++) {
      const tablePhotos = []
      for (let j = 1; j <= 5; j++) {
        const src = `table-${i}/photo${j}.png`
        try {
          // Проверяем существование файла через fetch HEAD
          const res = await fetch(src, { method: 'HEAD' })
          if (res.ok) {
            tablePhotos.push(src)
          }
        } catch (e) {
          // ignore
        }
      }
      photos[i] = tablePhotos
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
    if (distance > 50) {
      nextPhoto(tableNumber)
    } else if (distance < -50) {
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
    1: { top: '25%', left: '12%', width: '8%', height: '12%', borderRadius: '0', }, // левый верхний квадратный стол
    2: { top: '18%', left: '25%', width: '15%', height: '10%', borderRadius: '0' }, // центральный верхний прямоугольный стол
    3: { top: '25%', left: '45%', width: '18%', height: '12%', borderRadius: '0' }, // правый верхний большой стол
    4: { bottom: '30%', left: '12%', width: '8%', height: '12%', borderRadius: '0' }, // левый нижний квадратный стол
    5: { bottom: '30%', left: '25%', width: '15%', height: '10%', borderRadius: '0' }, // центральный нижний прямоугольный стол
    6: { bottom: '20%', right: '12%', width: '3%', height: '3%', borderRadius: '50%' }, // барный стул 1
    7: { bottom: '20%', right: '18%', width: '3%', height: '3%', borderRadius: '50%' }, // барный стул 2
    8: { bottom: '20%', right: '24%', width: '3%', height: '3%', borderRadius: '50%' }, // барный стул 3
    9: { bottom: '20%', right: '30%', width: '3%', height: '3%', borderRadius: '50%' }, // барный стул 4
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
        <SVGMap 
          tables={tables} 
          hoveredTable={hoveredTable} 
          setHoveredTable={setHoveredTable} 
          bookTable={bookTable} 
          getTablePhotos={getTablePhotos} 
          currentPhotoIndex={currentPhotoIndex} 
          nextPhoto={nextPhoto} 
          prevPhoto={prevPhoto} 
          showTableInfo={{ handleTouchStart, handleTouchMove, handleTouchEnd }}
        />
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
              disabled={!bookingData.name || bookingData.phone.length < 11}
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