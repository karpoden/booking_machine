-- Создание базы данных
CREATE DATABASE IF NOT EXISTS restaurant_booking;
USE restaurant_booking;

-- Таблица столов
CREATE TABLE IF NOT EXISTS tables (
  id INT PRIMARY KEY,
  seats INT NOT NULL,
  status ENUM('available', 'booked') DEFAULT 'available'
);

-- Таблица бронирований
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_id INT,
  booking_date DATE,
  booking_time TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES tables(id)
);

-- Добавление столов
INSERT INTO tables (id, seats) VALUES 
(1, 4), 
(2, 2), 
(3, 6), 
(4, 8);