-- phpMyAdmin SQL Dump
-- GiveTzy Database Schema
-- Updated to match backend models

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `givetzy_db`
--
CREATE DATABASE IF NOT EXISTS `givetzy_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `givetzy_db`;

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `refresh_token` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users` (contoh data)
--

INSERT INTO `users` (`name`, `email`, `password`, `phone_number`, `address`, `created_at`) VALUES
('Test User', 'test@example.com', '$2b$10$704HOEwZUkDXftUMzFsvOuFM22vUWwA/BPyZG3wACb9rJsSY0/Hai', '08123456789', 'Jakarta', NOW()),
('Yedhit Trisakti', 'yedhit@example.com', '$2b$10$rJ7JlEn5dRnPanPJdBfzDOnfnsEe8OzNwSeDsl/fol.7QoYtS6gDO', '08567890123', 'Bandung', NOW());

-- --------------------------------------------------------

--
-- Struktur dari tabel `items` (barang)
--

DROP TABLE IF EXISTS `items`;
CREATE TABLE `items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Lainnya',
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `condition` enum('Baru','Bekas - Seperti Baru','Bekas - Baik','Bekas - Cukup') NOT NULL DEFAULT 'Bekas - Baik',
  `location` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `image_data` LONGBLOB DEFAULT NULL,
  `image_mimetype` varchar(50) DEFAULT NULL,
  `status` enum('available','sold') NOT NULL DEFAULT 'available',
  `date_posted` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  KEY `category` (`category`),
  CONSTRAINT `items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `items` (contoh data)
--

INSERT INTO `items` (`user_id`, `item_name`, `description`, `category`, `price`, `condition`, `location`, `status`, `date_posted`) VALUES
(1, 'Laptop Dell Inspiron', 'Laptop bekas kondisi baik, RAM 8GB, SSD 256GB', 'Electronics', 3500000.00, 'Bekas - Baik', 'Jakarta', 'available', NOW()),
(2, 'Sepeda Gunung Polygon', 'Sepeda gunung baru, belum pernah dipakai', 'Sports', 2500000.00, 'Baru', 'Bandung', 'available', NOW());

-- --------------------------------------------------------

--
-- Struktur dari tabel `transactions` (transaksi)
--

DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `transaction_id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) NOT NULL,
  `buyer_id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `total_price` decimal(10,2) NOT NULL,
  `status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  `payment_method` varchar(100) DEFAULT 'Cash',
  `shipping_address` text DEFAULT NULL,
  `transaction_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  KEY `item_id` (`item_id`),
  KEY `buyer_id` (`buyer_id`),
  KEY `seller_id` (`seller_id`),
  KEY `status` (`status`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `transactions_ibfk_3` FOREIGN KEY (`seller_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `transactions` (contoh data)
--

INSERT INTO `transactions` (`item_id`, `buyer_id`, `seller_id`, `quantity`, `total_price`, `status`, `payment_method`, `shipping_address`, `transaction_date`) VALUES
(1, 2, 1, 1, 3500000.00, 'pending', 'Transfer Bank', 'Jl. Sample No. 456, Bandung', NOW());

-- --------------------------------------------------------

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
