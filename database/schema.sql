-- SI-KASKUL Database Schema (MySQL)
-- Untuk di-upload ke cloud hosting (IDCloudHost, dll)
-- NOTE: Use si-kaskul-data.sql which contains schema + data combined
-- This file is kept for reference only

CREATE DATABASE IF NOT EXISTS si_kaskul CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE si_kaskul;

-- ============================================
-- Users (admin, rt, kolektor)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  nik VARCHAR(50) UNIQUE,
  rt VARCHAR(100),
  rw VARCHAR(50)
) ENGINE=InnoDB;

-- ============================================
-- Penduduk (data penduduk dari Monografi Desa)
-- ============================================
CREATE TABLE IF NOT EXISTS penduduk (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nik VARCHAR(50) UNIQUE NOT NULL,
  kk VARCHAR(50),
  nama VARCHAR(255) NOT NULL,
  tempatLahir VARCHAR(100),
  tanggalLahir VARCHAR(50),
  jenisKelamin VARCHAR(20),
  kampung VARCHAR(255),
  rt VARCHAR(10),
  rw VARCHAR(10),
  alamat TEXT,
  umur INT,
  shdk VARCHAR(50),
  agama VARCHAR(50),
  pendidikan VARCHAR(100),
  pekerjaan VARCHAR(100),
  ayah VARCHAR(255),
  ibu VARCHAR(255),
  INDEX idx_rt (rt),
  INDEX idx_rw (rw),
  INDEX idx_agama (agama),
  INDEX idx_jk (jenisKelamin),
  INDEX idx_nama (nama)
) ENGINE=InnoDB;

-- ============================================
-- PBB Warga (unique taxpayers, 1 NOP = 1 warga)
-- ============================================
CREATE TABLE IF NOT EXISTS pbb_warga (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nik VARCHAR(50),
  nop VARCHAR(100) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  alamat TEXT,
  dusun VARCHAR(50),
  dusunNama VARCHAR(100),
  rw VARCHAR(50),
  rwNama VARCHAR(50),
  rt VARCHAR(50),
  rtNama VARCHAR(50),
  pajak2026 BIGINT DEFAULT 0,
  status VARCHAR(50),
  totalPajak BIGINT DEFAULT 0,
  totalLunas BIGINT DEFAULT 0,
  totalBelumBayar BIGINT DEFAULT 0,
  payments JSON DEFAULT NULL,
  INDEX idx_nop (nop),
  INDEX idx_nik (nik),
  INDEX idx_dusun (dusun),
  INDEX idx_rw (rw),
  INDEX idx_rt (rt),
  INDEX idx_status (status),
  INDEX idx_nama (nama)
) ENGINE=InnoDB;

-- ============================================
-- PBB Records (per-year tax records)
-- ============================================
CREATE TABLE IF NOT EXISTS pbb_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nop VARCHAR(100) NOT NULL,
  nik VARCHAR(50),
  nama VARCHAR(255) NOT NULL,
  alamat TEXT,
  dusun VARCHAR(50),
  dusunNama VARCHAR(100),
  rw VARCHAR(50),
  rwNama VARCHAR(50),
  rt VARCHAR(50),
  rtNama VARCHAR(50),
  year INT NOT NULL,
  pajak BIGINT DEFAULT 0,
  wajibBayar BIGINT DEFAULT 0,
  status VARCHAR(50),
  paidAt VARCHAR(100),
  namaPenyetor VARCHAR(255),
  keterangan TEXT,
  INDEX idx_nop (nop),
  INDEX idx_year (year),
  INDEX idx_status (status),
  INDEX idx_rw (rw),
  INDEX idx_rt (rt)
) ENGINE=InnoDB;

-- ============================================
-- Berita
-- ============================================
CREATE TABLE IF NOT EXISTS berita (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  date VARCHAR(50) NOT NULL,
  content TEXT NOT NULL
) ENGINE=InnoDB;

-- ============================================
-- Bansos penerima
-- ============================================
CREATE TABLE IF NOT EXISTS bansos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  no INT,
  nama VARCHAR(255) NOT NULL,
  alamat TEXT,
  rt VARCHAR(50),
  program VARCHAR(255),
  status VARCHAR(50)
) ENGINE=InnoDB;

-- ============================================
-- Bansos programs
-- ============================================
CREATE TABLE IF NOT EXISTS bansos_programs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama VARCHAR(255) NOT NULL,
  sumber VARCHAR(100),
  periode VARCHAR(50),
  kuota INT,
  deskripsi TEXT
) ENGINE=InnoDB;

-- ============================================
-- Pengaduan
-- ============================================
CREATE TABLE IF NOT EXISTS pengaduan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(100),
  type VARCHAR(100),
  message TEXT,
  submittedAt VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'Diterima',
  balasan TEXT
) ENGINE=InnoDB;

-- ============================================
-- PBB approvals
-- ============================================
CREATE TABLE IF NOT EXISTS approvals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pbbId INT NOT NULL,
  nop VARCHAR(100),
  nama VARCHAR(255),
  approvedBy VARCHAR(255),
  approveStatus VARCHAR(50),
  note TEXT,
  approvedAt VARCHAR(100)
) ENGINE=InnoDB;

-- ============================================
-- Surat Online
-- ============================================
CREATE TABLE IF NOT EXISTS surat (
  id INT PRIMARY KEY AUTO_INCREMENT,
  jenis VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  nik VARCHAR(50) NOT NULL,
  alamat TEXT,
  keperluan TEXT,
  status VARCHAR(50) DEFAULT 'Diajukan',
  nomorSurat VARCHAR(100),
  ditandatanganiOleh VARCHAR(255),
  catatan TEXT,
  diajukanPada VARCHAR(100) NOT NULL,
  diprosesPada VARCHAR(100)
) ENGINE=InnoDB;

-- ============================================
-- Activity logs
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action VARCHAR(255) NOT NULL,
  userId INT,
  userName VARCHAR(255),
  details TEXT,
  createdAt VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

SHOW TABLES;
